import { useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { answerQuestion, updateAnswerResult } from '@educaplay/store/slices/gameSlice';
import { playerAnswerConsumed } from '@educaplay/store/slices/multiplayerSlice';
import { useMultiplayer } from '@educaplay/core/hooks';

// Convierte de vuelta el payload guardado en Redis (canonicalizado a
// answer.id) a la posición en el array local de respuestas que el front
// espera en state.game.questions[i].answer. El array local puede estar
// permutado por answerOrders, así que buscamos por id en lugar de asumir
// que la posición coincide con el índice del XML original.
function denormalizeAnswer(payload, answers) {
    if (!payload || typeof payload !== 'object' || !Array.isArray(answers)) return payload;
    const v = payload.answer;
    if (v == null) return payload;

    const toLocalPos = (raw) => {
        if (typeof raw !== 'number' && typeof raw !== 'string') return raw;
        const idStr = String(raw);
        const pos = answers.findIndex(a => String(a?.id) === idStr);
        return pos >= 0 ? pos : raw;
    };

    if (Array.isArray(v)) {
        return { ...payload, answer: v.map(toLocalPos) };
    }
    return { ...payload, answer: toLocalPos(v) };
}

// Tras un F5 sobre una pregunta ya contestada, el backend devuelve en
// setLobbyData el payload original que el jugador envió junto con el
// resultado autoritativo (isCorrect y puntos arcade/real). Este hook
// repuebla state.game.questions[i].answer y answerResult para que el
// modal "has respondido X" se renderice con los valores reales sin que
// el resto del flujo tenga que enterarse de que la respuesta vino por
// rehidratación. useMultiplayerAnswer respeta el flag alreadyAnswered y
// no la reenvía.
export function useMultiplayerRehydrateAnswer() {
    const dispatch = useDispatch();
    const { isPlayer } = useMultiplayer();
    const questionIndex = useSelector(state => state.multiplayer.question?.index ?? null);
    const playerAnswer = useSelector(state => state.multiplayer.question?.playerAnswer ?? null);
    const questions = useSelector(state => state.game.questions);
    // Evita que el efecto se vuelva a disparar para el mismo índice tras
    // poblar la respuesta y antes de que playerAnswerConsumed propague
    const consumedRef = useRef(new Set());

    useEffect(() => {
        if (!isPlayer) return;
        if (questionIndex == null) return;
        if (!playerAnswer) return;
        if (!questions || !questions[questionIndex]) return;
        if (consumedRef.current.has(questionIndex)) return;

        consumedRef.current.add(questionIndex);

        // Si la respuesta local ya está poblada (el jugador respondió en esta
        // sesión y luego algo dispara una re-rehidratación), no la pisamos
        if (questions[questionIndex].answer == null) {
            // playerAnswer trae el payload original mezclado con los campos del
            // resultado autoritativo: separamos lo que aplica a la respuesta de
            // lo que aplica al answerResult antes de despachar
            const { isCorrect, realPoints, arcadePoints, ...rawPayload } = playerAnswer;
            const localAnswer = denormalizeAnswer(rawPayload, questions[questionIndex].answers);
            dispatch(answerQuestion({
                answer: localAnswer,
                isCorrect: false,
                points: 0,
                questionIndexAnswer: questionIndex,
                skipResult: true,
            }));
            dispatch(updateAnswerResult({
                questionIndex,
                isCorrect: !!isCorrect,
                realPoints: Number(realPoints) || 0,
                arcadePoints: Number(arcadePoints) || 0,
            }));
        }
        dispatch(playerAnswerConsumed());
    }, [isPlayer, questionIndex, playerAnswer, questions, dispatch]);
}
