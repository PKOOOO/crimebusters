import { useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { pauseGame } from '@educaplay/store/slices/gameSlice';
import { submitAnswer } from '@educaplay/core/services/multiplayer';
import { useMultiplayer } from '@educaplay/core/hooks';

// Convierte una respuesta expresada como posición(es) en el array local de
// respuestas (que puede estar permutado por la aleatorización común del
// match) a su forma canónica: el `id` de cada answer (que equivale a su
// posición en el XML original). Así el backend valida por id sin tener que
// reconciliar la permutación.
//
// Cubre los casos comunes: `answer` numérico (posición) → id; array de
// posiciones → array de ids. Cualquier otro formato se deja sin tocar (los
// juegos con respuestas no-posicionales ya envían texto u otro identificador).
function canonicalizeAnswer(payload, answers) {
    if (!payload || typeof payload !== 'object' || !Array.isArray(answers)) return payload;
    const v = payload.answer;
    if (v == null) return payload;

    const toCanonical = (raw) => {
        if (typeof raw !== 'number' && typeof raw !== 'string') return raw;
        const pos = typeof raw === 'string' ? parseInt(raw, 10) : raw;
        if (!Number.isInteger(pos) || pos < 0 || pos >= answers.length) return raw;
        const id = answers[pos]?.id;
        if (id === undefined) return raw;
        const numericId = parseInt(id, 10);
        return Number.isNaN(numericId) ? id : numericId;
    };

    if (Array.isArray(v)) {
        return { ...payload, answer: v.map(toCanonical) };
    }
    return { ...payload, answer: toCanonical(v) };
}

export function useMultiplayerAnswer() {
    const dispatch = useDispatch();
    const { isMultiplayer } = useMultiplayer();
    const match = useSelector(state => state.multiplayer.match);
    const questions = useSelector(state => state.game.questions);
    const currentQuestionIndex = useSelector(state => state.multiplayer.question?.index ?? null);
    const currentQuestionPhase = useSelector(state => state.multiplayer.question?.phase ?? null);
    const alreadyAnswered = useSelector(state => state.multiplayer.question?.alreadyAnswered ?? false);
    const processedRef = useRef(new Set());

    useEffect(() => {
        if (!isMultiplayer || !match?.id) return;

        questions.forEach((question, index) => {
            if (question.answer === null) return;
            if (processedRef.current.has(index)) return;

            // Solo procesamos respuestas para la pregunta abierta en el backend
            if (currentQuestionPhase !== 'answering' || currentQuestionIndex !== index) {
                // Marcamos como procesada para no reintentarla. La respuesta se descarta:
                // el player se reincorporará al ritmo del backend cuando responda
                // a una pregunta cuyo índice sí coincida.
                processedRef.current.add(index);
                return;
            }

            // El answer viene de la rehidratación (F5 sobre una pregunta que el
            // jugador ya había contestado). El servidor ya la tiene en Redis;
            // reenviarla sería un no-op para él, pero además dispararía otra vez
            // el pauseGame de abajo, que ya está cubierto por useMultiplayerSync
            // al detectar isFirstSync && alreadyAnswered.
            if (alreadyAnswered) {
                processedRef.current.add(index);
                return;
            }

            processedRef.current.add(index);
            const rawPayload = question.serializeAnswer
                ? question.serializeAnswer(question.answer)
                : question.answer;
            const payload = canonicalizeAnswer(rawPayload, question.answers);
            // Fire-and-forget: el dispatcher del backend valida y emite
            // playerAnswered (broadcast) con isCorrect/realPoints/arcadePoints.
            // El propio jugador lo recibe igual que el host y un listener en
            // WebSocketProvider despacha updateAnswerResult cuando el playerId
            // del mensaje coincide con el suyo.
            submitAnswer(index, payload);
            dispatch(pauseGame());
        });
    }, [questions, isMultiplayer, match?.id, currentQuestionIndex, currentQuestionPhase, alreadyAnswered, dispatch]);
}
