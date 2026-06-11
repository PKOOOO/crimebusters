import { useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { goToQuestion } from '@educaplay/store/slices/gameSlice';

const MAX_ATTEMPTS = 50;
const RETRY_MS = 100;

// Sincroniza el juego (Redux + escena Phaser) con la pregunta abierta en el
// servidor. Es la única fuente de verdad para "qué pregunta toca" y la usan
// tanto el player como el host. El parámetro `enabled` permite al host inhibir
// la sincronización visual mientras muestra el statement de la siguiente
// pregunta (la escena se sigue actualizando, pero no llamamos a goToQuestion
// para evitar sonidos/animaciones detrás del overlay).
export function useGameQuestionSync(gameRef, enabled = true) {
    const dispatch = useDispatch();
    const serverQuestionIndex = useSelector(state => state.multiplayer.question?.index ?? null);
    const previousIndexRef = useRef(null);
    // Mantenemos el handle del reintento activo para cancelarlo si llega un
    // índice nuevo o el componente se desmonta. Si no, varios cambios rápidos
    // de pregunta podrían dejar varias cadenas de reintentos en paralelo,
    // pisándose unas a otras y aplicando un goToQuestion obsoleto al final.
    const retryHandleRef = useRef(null);

    useEffect(() => {
        if (serverQuestionIndex == null) return;
        if (serverQuestionIndex === previousIndexRef.current) return;
        if (!enabled) return;

        previousIndexRef.current = serverQuestionIndex;
        dispatch(goToQuestion(serverQuestionIndex));

        // Cancelamos cualquier reintento previo: solo nos interesa converger
        // al ÚLTIMO índice solicitado
        if (retryHandleRef.current) {
            clearTimeout(retryHandleRef.current);
            retryHandleRef.current = null;
        }

        let cancelled = false;
        const attempt = (attempts) => {
            if (cancelled) return;
            const goTo = gameRef?.current?.goToQuestion;
            if (typeof goTo === 'function') {
                try {
                    goTo.call(gameRef.current, serverQuestionIndex);
                    return;
                } catch (e) {
                    // La escena Phaser todavía no ha terminado create(),
                    // reintentamos en el próximo tick
                }
            }
            if (attempts < MAX_ATTEMPTS) {
                retryHandleRef.current = setTimeout(() => attempt(attempts + 1), RETRY_MS);
            }
        };
        attempt(0);

        return () => {
            cancelled = true;
            if (retryHandleRef.current) {
                clearTimeout(retryHandleRef.current);
                retryHandleRef.current = null;
            }
        };
    }, [serverQuestionIndex, enabled, dispatch, gameRef]);
}
