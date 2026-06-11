import { useSelector } from 'react-redux';

// Devuelve el deadline (timestamp absoluto del servidor en segundos) de la pregunta actual
// Lee del estado centralizado en multiplayerSlice
export function useQuestionDeadline() {
    return useSelector(state => state.multiplayer.question?.deadline ?? null);
}
