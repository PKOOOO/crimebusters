import { useCallback, useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { kickPlayer } from '../services/multiplayer';
import { useTranslate } from './useTranslate';

// La preferencia "no preguntar de nuevo" se guarda en sessionStorage para que
// dure toda la sesión del navegador (lobby + partida) y se resetee al cerrar
// la pestaña. Se comparte entre el lobby y el ranking entre preguntas para
// que el host no tenga que reconfirmarla en cada contexto
const SKIP_KICK_CONFIRM_STORAGE_KEY = 'educaplay.multiplayer.skipKickConfirm';

const readSkipKickConfirm = () => {
    try {
        return window.sessionStorage.getItem(SKIP_KICK_CONFIRM_STORAGE_KEY) === '1';
    } catch (e) {
        return false;
    }
};

const writeSkipKickConfirm = () => {
    try {
        window.sessionStorage.setItem(SKIP_KICK_CONFIRM_STORAGE_KEY, '1');
    } catch (e) {
        // Si sessionStorage no está disponible la preferencia se respetará
        // sólo durante el ciclo de vida del componente
    }
};

export function useKickPlayerFlow() {
    const t = useTranslate();
    const players = useSelector(state => state.multiplayer.players);
    const [kickTarget, setKickTarget] = useState(null);
    const skipKickConfirmRef = useRef(readSkipKickConfirm());
    // Mantenemos players y t en refs para que `requestKick` sea estable. Si no,
    // cada vez que entra/sale un jugador cambiaría la referencia y todas las
    // PlayerCard memoizadas se re-renderizarían igualmente.
    const playersRef = useRef(players);
    const tRef = useRef(t);
    useEffect(() => { playersRef.current = players; }, [players]);
    useEffect(() => { tRef.current = t; }, [t]);

    const performKick = useCallback(async (playerId) => {
        try {
            await kickPlayer(playerId);
        } catch (e) {
            console.error('Error kicking player:', e);
        }
    }, []);

    const requestKick = useCallback((playerId) => {
        if (skipKickConfirmRef.current) {
            performKick(playerId);
            return;
        }
        const player = playersRef.current.find(p => p.id === String(playerId));
        const nickname = player?.nickname || tRef.current('common.multiplayer.lobby.thisPlayer');
        setKickTarget({ playerId, nickname });
    }, [performKick]);

    const cancelKick = useCallback(() => {
        setKickTarget(null);
    }, []);

    const confirmKick = useCallback((dontAskAgain) => {
        if (dontAskAgain) {
            skipKickConfirmRef.current = true;
            writeSkipKickConfirm();
        }
        const target = kickTarget;
        setKickTarget(null);
        if (target) performKick(target.playerId);
    }, [kickTarget, performKick]);

    return {
        kickTarget,
        requestKick,
        cancelKick,
        confirmKick,
    };
}
