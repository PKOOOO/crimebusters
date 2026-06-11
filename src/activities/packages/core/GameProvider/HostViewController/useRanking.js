import { useState, useCallback, useMemo, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useEvent } from '../../hooks/useEvent';

export function useRanking() {
    // Valor inicial desde el store para rehidratar tras F5 del host (la
    // snapshot del REST trae el ranking; el broadcast rankingUpdated ya es
    // persistente y cubre la ventana posterior al GET)
    const hydratedRanking = useSelector(state => state.multiplayer.ranking ?? []);
    const [ranking, setRanking] = useState(hydratedRanking);
    // El backend solo recalcula y reenvía el ranking entre preguntas. Cuando
    // el host expulsa a un jugador a mitad, mantenemos un set local con sus
    // ids para ocultarlo en el modal del ranking antes de que llegue el
    // siguiente rankingUpdated (que ya vendrá depurado)
    const [kickedIds, setKickedIds] = useState(() => new Set());
    // Mapa con la posición de cada jugador en el ranking previo. Lo usamos
    // para calcular cuánto ha subido o bajado cada uno entre rondas y pintar
    // las flechas correspondientes en el modal. Usamos ref para que el
    // historial persista entre renders sin provocarlos
    const previousPositionsRef = useRef(new Map());

    const annotateWithDelta = useCallback((list) => {
        const previous = previousPositionsRef.current;
        const isFirstRound = previous.size === 0;
        return list.map((player) => {
            const id = String(player.playerId);
            const prevPosition = previous.get(id);
            // En la primera ronda (o si el jugador no estaba en la anterior)
            // no hay con qué comparar: marcamos null para que la UI suprima
            // la pastilla. Si el delta resulta 0 (misma posición) la UI
            // también la oculta; solo se pinta cuando hay subida o bajada
            if (isFirstRound || prevPosition == null) {
                return { ...player, positionDelta: null };
            }
            return { ...player, positionDelta: prevPosition - player.position };
        });
    }, []);

    const handleRankingUpdated = useCallback((message) => {
        const incoming = message.ranking ?? [];
        const annotated = annotateWithDelta(incoming);
        setRanking(annotated);
        // Guardamos las posiciones de este ranking para la siguiente comparación
        const nextPositions = new Map();
        incoming.forEach((player) => {
            nextPositions.set(String(player.playerId), player.position);
        });
        previousPositionsRef.current = nextPositions;
        // El nuevo ranking ya viene depurado: vaciamos el set para no acarrear
        // ids obsoletos durante toda la partida
        setKickedIds(new Set());
    }, [annotateWithDelta]);

    const handlePlayerKicked = useCallback((message) => {
        const id = message.player?.id;
        if (id == null) return;
        setKickedIds(prev => {
            const next = new Set(prev);
            next.add(String(id));
            return next;
        });
    }, []);

    useEvent('rankingUpdated', handleRankingUpdated);
    useEvent('playerKicked', handlePlayerKicked);

    const visibleRanking = useMemo(() => (
        kickedIds.size === 0
            ? ranking
            : ranking.filter(p => !kickedIds.has(String(p.playerId)))
    ), [ranking, kickedIds]);

    // reset() se invoca entre preguntas (requestNextQuestion). Limpiamos el
    // estado de UI pero NO previousPositionsRef: lo necesitamos preservado
    // para poder calcular el delta entre la ronda anterior y la siguiente.
    // Sin esto, cada ronda parecería la primera y las flechas nunca aparecen
    const reset = useCallback(() => {
        setRanking([]);
        setKickedIds(new Set());
    }, []);

    return { ranking: visibleRanking, reset };
}
