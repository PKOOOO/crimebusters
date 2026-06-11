import { useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { pauseGame, resumeGame, answerQuestion, updateAnswerResult, setQuestionTime } from '@educaplay/store/slices/gameSlice';
import { useMultiplayer, useGameQuestionSync } from '@educaplay/core/hooks';

// Sincroniza al player con el ritmo de pregunta del backend.
// La parte de "ir a la pregunta correcta" la hace useGameQuestionSync, que es
// la única fuente de verdad y la comparten player y host. Aquí solo manejamos
// pause/resume del juego en función de la fase y de si el jugador ya respondió
export function useMultiplayerSync(gameRef) {
    const dispatch = useDispatch();
    const { isPlayer } = useMultiplayer();
    const questionIndex = useSelector(state => state.multiplayer.question?.index ?? null);
    const questionPhase = useSelector(state => state.multiplayer.question?.phase ?? null);
    const alreadyAnswered = useSelector(state => state.multiplayer.question?.alreadyAnswered ?? false);
    const deadline = useSelector(state => state.multiplayer.question?.deadline ?? null);
    const questions = useSelector(state => state.game.questions);
    const previousIndexRef = useRef(null);
    const previousPhaseRef = useRef(null);
    const previousDeadlineRef = useRef(null);
    // Guardamos questions en una ref para no incluirlo en las deps del efecto:
    // su referencia cambia cada vez que answerQuestion muta el estado del juego,
    // y eso provocaría re-ejecutar el efecto y volver a dispatch(pauseGame()).
    const questionsRef = useRef(questions);
    useEffect(() => { questionsRef.current = questions; }, [questions]);

    // Sincronizar la escena Phaser con la pregunta del backend
    useGameQuestionSync(gameRef, isPlayer);

    // Sincronizar el tiempo restante de la pregunta con el deadline autoritativo
    // del servidor para que el reloj del footer arranque en el valor correcto
    // (compensando latencia de red y el countdown de inicio).
    useEffect(() => {
        if (!isPlayer) return;
        if (deadline === previousDeadlineRef.current) return;
        previousDeadlineRef.current = deadline;
        if (deadline == null || questionIndex == null) return;

        const remainingMs = deadline * 1000 - Date.now();
        const secondsLeft = Math.max(0, Math.ceil(remainingMs / 1000));
        dispatch(setQuestionTime({ index: questionIndex, time: secondsLeft }));
    }, [isPlayer, deadline, questionIndex, dispatch]);

    useEffect(() => {
        if (!isPlayer) return;

        if (questionIndex !== null && questionIndex !== previousIndexRef.current) {
            const isFirstSync = previousIndexRef.current === null;
            previousIndexRef.current = questionIndex;

            // Si estamos en fase de respuesta y el jugador no había respondido
            // todavía, reanudamos. En reconexión, si ya respondió, mantenemos
            // pausado para que vea la pregunta sin volver a contestar.
            if (questionPhase === 'answering' && !(isFirstSync && alreadyAnswered)) {
                dispatch(resumeGame());
            } else {
                dispatch(pauseGame());
            }
        }

        // Pregunta cerrada -> pausar a la espera de la siguiente. Solo actuamos
        // en la transición real a 'closed' (no en cada re-render con phase ya
        // cerrada): si no, dispatch(pauseGame()) se repetiría inútilmente cada
        // vez que cambia algo en state.game.
        const phaseChanged = questionPhase !== previousPhaseRef.current;
        previousPhaseRef.current = questionPhase;
        if (questionPhase === 'closed' && phaseChanged) {
            dispatch(pauseGame());

            // Si el jugador no respondió (tiempo agotado), registramos una
            // respuesta vacía con 0 puntos para que el PlayerPointsModal se muestre.
            // Si ya respondió (caso normal o tras F5), useMultiplayerRehydrateAnswer
            // ya habrá rellenado answerResult con el resultado autoritativo y no
            // debemos pisarlo: por eso filtramos por !alreadyAnswered además de
            // !answerResult, ya que tras F5 el orden de useEffects puede hacer
            // que veamos answerResult aún null en este render.
            if (questionIndex !== null && !alreadyAnswered) {
                const question = questionsRef.current[questionIndex];
                if (question && !question.answerResult) {
                    dispatch(answerQuestion({
                        answer: '',
                        isCorrect: false,
                        points: 0,
                        questionIndexAnswer: questionIndex,
                        skipResult: true,
                    }));
                    dispatch(updateAnswerResult({
                        questionIndex,
                        isCorrect: false,
                        realPoints: 0,
                        arcadePoints: 0,
                    }));
                }
            }
        }
    }, [isPlayer, questionIndex, questionPhase, alreadyAnswered, dispatch]);
}
