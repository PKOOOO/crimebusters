import { useMultiplayer } from '@educaplay/core/hooks';
import { LobbyHost } from './LobbyHost';
import { LobbyPlayer } from './LobbyPlayer';

export function LobbyView() {
    // El guard de rehydrating vive en GameProviderView para que también
    // proteja al HostViewController/PlayerPostGame del flash del podio
    // de la partida anterior al rehidratar tras un F5.
    const { role, isHost } = useMultiplayer();
    if (!role) return null;
    return isHost ? <LobbyHost /> : <LobbyPlayer />;
}
