import { useCallback, useRef, useMemo, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useMultiplayerWS } from './useMultiplayerWS';
import {
    questionStarted, questionEnded, questionDeadlineSet, answerStatsReceived,
    setRehydrated, addPlayer, playerReconnected, removePlayer,
    lobbyLocked, matchStarted, matchFinished, matchRestarted,
    settingsUpdated, positionRevealed, rankingShown, rankingUpdated,
    feedbackVisibilityChanged, matchFeedbackAggregatesUpdated, playerAnswered,
} from '@educaplay/store/slices/multiplayerSlice';
import { updateAnswerResult } from '@educaplay/store/slices/gameSlice';
import { setWsClient } from '@educaplay/core/services/multiplayer';
import { WS_URL } from '@educaplay/core/utils/constants';
import { WebSocketContext } from './WebSocketContext';

export function WebSocketProvider({ children }) {
    const dispatch = useDispatch();
    const wsRoom = useSelector(state => state.multiplayer.match?.wsRoom ?? null);
    const playerId = useSelector(state => state.multiplayer.playerData?.id ?? null);

    const subscribersRef = useRef(new Map());

    const handleAction = useCallback((action, message) => {
        const handlers = subscribersRef.current.get(action);
        if (handlers) {
            handlers.forEach(handler => handler(message));
        }
    }, []);

    // Cuando el WS lleva 500ms sin recibir mensajes asumimos que la
    // rehidratación del backlog terminó: bajamos el flag para que el lobby
    // pueda empezar a pintar (mismo patrón que retos).
    const handleRehydrated = useCallback(() => {
        dispatch(setRehydrated());
    }, [dispatch]);

    const { send, request, connected } = useMultiplayerWS({
        wsUrl: WS_URL,
        wsRoom,
        playerId,
        onAction: handleAction,
        onRehydrated: handleRehydrated,
    });

    // Registrar el cliente WS en el módulo de servicios para que sus funciones
    // (startMatch, kickPlayer, ...) puedan invocar request() sin pasar por React
    useEffect(() => {
        setWsClient({ request, send });
        return () => setWsClient(null);
    }, [request, send]);

    const subscribe = useCallback((action, handler) => {
        if (!subscribersRef.current.has(action)) {
            subscribersRef.current.set(action, new Set());
        }
        subscribersRef.current.get(action).add(handler);
        return () => subscribersRef.current.get(action)?.delete(handler);
    }, []);

    // Traducción centralizada de broadcasts del backend a acciones del store.
    // Sin este paso los reducers del slice nunca se invocan: el cliente recibe
    // los mensajes pero el estado de Redux no se actualiza, y los componentes
    // siguen viendo la snapshot inicial congelada. Cualquier acción nueva del
    // dispatcher del backend tiene que añadir aquí su traducción para que el
    // resto de la UI la vea reflejada.
    useEffect(() => {
        const unsubs = [
            // Ciclo de pregunta
            subscribe('questionStart', (msg) => dispatch(questionStarted({
                index: msg.questionIndex,
                startedAt: msg.startedAt,
            }))),
            subscribe('questionEnd', () => dispatch(questionEnded())),
            subscribe('questionDeadline', (msg) => dispatch(questionDeadlineSet({
                deadline: msg.deadline,
                duration: msg.duration,
            }))),
            subscribe('answerStats', (msg) => dispatch(answerStatsReceived({
                questionIndex: msg.questionIndex,
                totalAnswers: msg.totalAnswers,
                totalPlayers: msg.totalPlayers,
                buckets: msg.buckets,
            }))),
            subscribe('rankingUpdated', (msg) => dispatch(rankingUpdated({ ranking: msg.ranking }))),
            subscribe('rankingShown', () => dispatch(rankingShown())),
            // El broadcast playerAnswered llega a TODOS los clientes. Lo
            // despachamos al slice multiplayer (que actualiza answeredCount
            // del host y, si es el propio jugador, alreadyAnswered/playerAnswer/
            // score). Adicionalmente, si la respuesta es del propio jugador,
            // tocamos game.answerResult para que el modal pinte sus puntos.
            subscribe('playerAnswered', (msg) => {
                dispatch(playerAnswered(msg));
                if (playerId == null) return;
                if (String(msg.playerId) !== String(playerId)) return;
                dispatch(updateAnswerResult({
                    questionIndex: msg.questionIndex,
                    isCorrect: msg.isCorrect,
                    realPoints: msg.realPoints,
                    arcadePoints: msg.arcadePoints,
                }));
            }),
            // Presencia de jugadores en el lobby. El backend solo emite los
            // eventos de reconexión / desconexión / expulsión — la primera
            // aparición de un jugador llega como playerReconnected (markConnected
            // se ejecuta en su primer join WS y trata la transición 0→1 igual
            // que un reconnect)
            subscribe('playerReconnected', (msg) => dispatch(playerReconnected(msg.player))),
            subscribe('playerJoined', (msg) => dispatch(addPlayer(msg.player))),
            subscribe('playerDisconnected', (msg) => dispatch(removePlayer(msg.player))),
            subscribe('playerLeft', (msg) => dispatch(removePlayer(msg.player))),
            subscribe('playerKicked', (msg) => dispatch(removePlayer(msg.player))),
            // Ciclo del match y configuración del lobby
            subscribe('matchStarted', (msg) => dispatch(matchStarted({
                questionOrder: msg.questionOrder,
                answerOrders: msg.answerOrders,
            }))),
            subscribe('matchFinished', (msg) => dispatch(matchFinished({ ranking: msg.ranking }))),
            // El reinicio migra a una partida nueva: el reducer cambia
            // wsRoom/playerId (y el WS reconecta solo). Además actualizamos la
            // URL al PIN nuevo para que un F5 resuelva la partida nueva en vez
            // del PIN viejo (que ya está finalizado).
            subscribe('matchRestarted', (msg) => {
                dispatch(matchRestarted(msg));
                if (msg.lobbyPath) {
                    window.history.replaceState(null, '', msg.lobbyPath);
                }
            }),
            subscribe('settingsUpdated', (msg) => dispatch(settingsUpdated({ settings: msg.settings }))),
            subscribe('lobbyLocked', (msg) => dispatch(lobbyLocked({ locked: msg.locked }))),
            // Pantalla de resultados / podio
            subscribe('positionRevealed', (msg) => dispatch(positionRevealed({ position: msg.position }))),
            subscribe('feedbackVisibilityChanged', (msg) => dispatch(feedbackVisibilityChanged({ visible: msg.visible }))),
            subscribe('matchFeedbackUpdated', (msg) => dispatch(matchFeedbackAggregatesUpdated(msg))),
        ];
        return () => unsubs.forEach((unsub) => unsub());
    }, [subscribe, dispatch, playerId]);

    const value = useMemo(
        () => ({ send, request, connected, subscribe }),
        [send, request, connected, subscribe]
    );

    return (
        <WebSocketContext.Provider value={value}>
            {children}
        </WebSocketContext.Provider>
    );
}
