import { useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useEvent } from '../hooks/useEvent';

// Listener global de la expulsión del propio jugador. Vive a nivel de
// GameProvider para que el redirect funcione tanto si el host expulsa en el
// lobby como si lo hace entre preguntas (en este caso LobbyPlayer ya está
// desmontado y nadie escucharía el evento)
export function PlayerKickListener() {
    const playerId = useSelector(state => state.multiplayer.playerData?.id ?? null);

    const handleKicked = useCallback((message) => {
        if (playerId == null) return;
        if (String(message.player?.id) !== String(playerId)) return;
        const gameUrl = window.__EDUCAPLAY_GAME_URL;
        const separator = gameUrl.includes('?') ? '&' : '?';
        window.location.href = `${gameUrl}${separator}kicked=1`;
    }, [playerId]);

    useEvent('playerKicked', handleKicked);

    return null;
}
