import { useSelector } from "react-redux";

// Centraliza la lectura del rol multijugador y sus derivados.
// Cualquier componente que necesite saber si está en multijugador, o si actúa
// como host/player, debe usar este hook en lugar de leer state.multiplayer.role
// directamente
export function useMultiplayer() {
    const role = useSelector(state => state.multiplayer.role);

    return {
        role,
        isMultiplayer: !!role,
        isHost: role === "host",
        isPlayer: role === "player",
    };
}
