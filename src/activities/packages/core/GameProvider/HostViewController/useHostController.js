import { useState, useCallback, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { HOST_VIEWS } from "@educaplay/store/constants";
import { pauseGame, resumeGame } from "@educaplay/store/slices/gameSlice";
import { startQuestion, endQuestion, setQuestionDeadline, finishMatch, restartMatch, closeMatch, notifyRankingShown } from "@educaplay/core/services/multiplayer";
import { useGameQuestionSync } from "@educaplay/core/hooks";
import { useAnswerTracker } from "./useAnswerTracker";
import { useRanking } from "./useRanking";
import { useQuestionDeadline } from "../../hooks/useQuestionDeadline";
import { useServerCountdown } from "../../hooks/useServerCountdown";
import { DELAYS, MODAL_TRANSITION_MS } from "./constants";

// Calcula el view inicial del host a partir del estado de pregunta del backend
// (necesario para reanudar correctamente tras un F5 del host)
function getInitialView(serverQuestion, finished) {
    if (finished) {
        return HOST_VIEWS.RESULTS;
    }
    if (!serverQuestion || serverQuestion.index == null) {
        return HOST_VIEWS.QUESTION_STATEMENT;
    }
    if (serverQuestion.phase === 'closed') {
        return HOST_VIEWS.CORRECT_ANSWER;
    }
    return HOST_VIEWS.GAME_VIEW;
}

export function useHostController(gameRef) {
    const dispatch = useDispatch();

    const match = useSelector(state => state.multiplayer.match);
    const questions = useSelector(state => state.game.questions);
    const players = useSelector(state => state.multiplayer.players);
    const isPaused = useSelector(state => state.game.isPaused);
    const serverQuestion = useSelector(state => state.multiplayer.question);
    const questionPhase = serverQuestion?.phase ?? null;
    const serverQuestionIndex = serverQuestion?.index ?? null;
    const stats = serverQuestion?.stats ?? null;
    const started = useSelector(state => state.multiplayer.started);
    const finished = useSelector(state => state.multiplayer.finished);
    const finalRanking = useSelector(state => state.multiplayer.ranking);
    // Si autoplay está desactivado, el host avanza manualmente entre las
    // pantallas post-pregunta pulsando el botón "Siguiente"
    const autoplay = useSelector(state => state.multiplayer.settings?.autoplay ?? false);

    // Si entramos en mitad de una pregunta abierta (F5 del host), arrancamos
    // directamente en la vista correspondiente
    const [view, setView] = useState(() => getInitialView(serverQuestion, finished));
    // Flag que activamos durante el intercambio manual de modals (stats→ranking)
    // y entre RANKING y la apertura de la siguiente pregunta. Bloquea el botón
    // de avance y obliga al toolbar a renderizar el icono pause/disabled
    const [isTransitioning, setIsTransitioning] = useState(false);
    // Marcamos que la primera pregunta procede de una reconexión: no hay que
    // volver a llamar a startQuestion en el backend (ya está abierta)
    const skipInitialStartRef = useRef(serverQuestionIndex != null || finished);
    // Para detectar transiciones reales del índice del backend (cambios entre
    // preguntas) frente a la primera vez que recibimos un valor (apertura
    // inicial o rehidratación tras F5)
    const prevServerIndexRef = useRef(serverQuestionIndex);

    const { answeredCount, reset: resetAnsweredCount } = useAnswerTracker();
    const { ranking, reset: resetRanking } = useRanking();
    const deadline = useQuestionDeadline();

    // Cuando vence el deadline, el host fuerza el cierre de la pregunta
    const handleDeadlineExpire = useCallback(() => {
        if (!match?.id) return;
        endQuestion('deadline').catch(() => {});
    }, [match?.id]);

    const secondsLeft = useServerCountdown(deadline, handleDeadlineExpire);

    // Sincronización con Phaser: la única fuente de verdad es serverQuestionIndex.
    // Inhibimos el sync mientras mostramos el statement de la pregunta para evitar
    // que se oigan animaciones/sonidos detrás del overlay
    useGameQuestionSync(gameRef, view !== HOST_VIEWS.QUESTION_STATEMENT);

    const displayedIndex = serverQuestionIndex ?? 0;
    const currentQuestion = questions[displayedIndex];
    const totalQuestions = questions.length;
    const totalPlayers = players.length;
    const isLastQuestion = displayedIndex >= totalQuestions - 1;

    // ─── Apertura de la primera pregunta ─────────────────────────────
    // Cuando el host entra al juego (matchStarted) sin que haya ninguna
    // pregunta abierta en el backend, abrimos la pregunta 0. En reconexión
    // por F5 (skipInitialStartRef) ya hay una pregunta abierta y no tocamos
    useEffect(() => {
        if (!match?.id) return;
        if (skipInitialStartRef.current) {
            skipInitialStartRef.current = false;
            return;
        }
        if (serverQuestionIndex != null) return;
        startQuestion(0).catch(() => {});
        // Solo al montar
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ─── Reacción al broadcast del backend ──────────────────────────
    // Cada vez que el backend abre una nueva pregunta (cambia el índice),
    // el host transiciona a QUESTION_STATEMENT. La primera vez que vemos un
    // índice (apertura inicial o rehidratación tras F5) no transicionamos:
    // ya estamos en la vista que corresponde
    useEffect(() => {
        if (serverQuestionIndex == null) return;
        if (prevServerIndexRef.current === serverQuestionIndex) return;
        const isFirstSet = prevServerIndexRef.current == null;
        prevServerIndexRef.current = serverQuestionIndex;
        if (isFirstSet) return;
        setView(HOST_VIEWS.QUESTION_STATEMENT);
        setIsTransitioning(false);
    }, [serverQuestionIndex]);

    // ─── Transiciones de vista ───────────────────────────────────────

    const handleCountdownFinish = useCallback(() => {
        setView(HOST_VIEWS.GAME_VIEW);
    }, []);

    // Avanzar a CORRECT_ANSWER cuando el backend cierra la pregunta (cualquier motivo)
    useEffect(() => {
        if (view !== HOST_VIEWS.GAME_VIEW) return;
        if (questionPhase === 'closed') {
            setView(HOST_VIEWS.CORRECT_ANSWER);
        }
    }, [view, questionPhase]);

    // Cuando entramos en CORRECT_ANSWER, mostrar la respuesta correcta en Phaser.
    // useGameQuestionSync ya posicionó la escena en serverQuestionIndex; aquí
    // solo necesitamos disparar la animación de "respuesta correcta"
    useEffect(() => {
        if (view !== HOST_VIEWS.CORRECT_ANSWER) return;
        if (!gameRef.current) return;
        if (typeof gameRef.current.goToCorrect === "function") {
            gameRef.current.goToCorrect();
        }
    }, [view, gameRef]);

    // Solicitud al backend de abrir una nueva pregunta. Lo usan tanto el
    // botón "siguiente" como el auto-avance desde RANKING. La transición de
    // vista la hace el effect que escucha cambios de serverQuestionIndex
    // cuando llega el broadcast del backend
    const requestNextQuestion = useCallback(() => {
        if (!match?.id) return;
        dispatch(resumeGame());
        resetAnsweredCount();
        resetRanking();
        const nextIndex = isLastQuestion ? 0 : displayedIndex + 1;
        startQuestion(nextIndex).catch(() => {});
    }, [match?.id, isLastQuestion, displayedIndex, dispatch, resetAnsweredCount, resetRanking]);

    // Transición de CORRECT_ANSWER a ANSWER_STATS (si hay estadísticas) o
    // directamente a RANKING. Este auto-avance se ejecuta también en modo
    // manual: tras las animaciones de Froggy queremos que aparezcan las stats
    // (o el ranking) sin requerir click del host.
    // En la última pregunta saltamos RANKING para no spoilear el podio final:
    // si no hay stats, vamos directos a finishMatch.
    // Sin jugadores conectados saltamos stats y ranking en bloque: el backend
    // envía rankingUpdated vacío y el guard ranking.length===0 nunca se
    // liberaría, dejando al host bloqueado con el botón de avance deshabilitado
    useEffect(() => {
        if (view !== HOST_VIEWS.CORRECT_ANSWER) return;
        const hasConnectedPlayers = players.length > 0;
        if (hasConnectedPlayers && ranking.length === 0) return;

        const hasStats = hasConnectedPlayers && stats && Array.isArray(stats.buckets) && stats.buckets.length > 0;

        const timer = setTimeout(() => {
            dispatch(pauseGame());
            if (!hasConnectedPlayers) {
                if (isLastQuestion) {
                    setIsTransitioning(true);
                    finishMatch().catch(() => setIsTransitioning(false));
                } else {
                    requestNextQuestion();
                }
                return;
            }
            if (hasStats) {
                setView(HOST_VIEWS.ANSWER_STATS);
            } else if (isLastQuestion) {
                setIsTransitioning(true);
                finishMatch().catch(() => setIsTransitioning(false));
            } else {
                setView(HOST_VIEWS.RANKING);
            }
        }, DELAYS.CORRECT_TO_STATS);

        return () => clearTimeout(timer);
    }, [view, ranking, stats, dispatch, isLastQuestion, players.length, requestNextQuestion]);

    // Transición de ANSWER_STATS a RANKING (o a finishMatch en la última pregunta,
    // saltando RANKING para no spoilear el podio final)
    useEffect(() => {
        if (view !== HOST_VIEWS.ANSWER_STATS) return;
        if (!autoplay) return;

        const timer = setTimeout(() => {
            if (isLastQuestion) {
                setIsTransitioning(true);
                finishMatch().catch(() => setIsTransitioning(false));
            } else {
                setView(HOST_VIEWS.RANKING);
            }
        }, DELAYS.STATS_TO_RANKING);

        return () => clearTimeout(timer);
    }, [view, autoplay, isLastQuestion]);

    // Avisamos a los jugadores en cuanto entramos en la vista RANKING para
    // que su PlayerPointsModal revele la posición que han conseguido. Se hace
    // aquí (y no en los call sites que ponen el view en RANKING) para cubrir
    // de un solo sitio tanto el avance manual como los dos auto-avances
    useEffect(() => {
        if (view !== HOST_VIEWS.RANKING) return;
        notifyRankingShown().catch(() => {});
    }, [view]);

    // Auto-avance de RANKING a siguiente pregunta o al podio final
    useEffect(() => {
        if (view !== HOST_VIEWS.RANKING) return;
        if (!autoplay) return;

        const timer = setTimeout(() => {
            if (isLastQuestion) {
                // Transicionar el match a estado RESULTS en el backend.
                // El broadcast matchFinished actualizará Redux con finished=true
                // y el ranking, lo que disparará el effect de abajo
                finishMatch().catch(() => {});
            } else {
                requestNextQuestion();
            }
        }, DELAYS.RANKING_TO_NEXT);

        return () => clearTimeout(timer);
    }, [view, isLastQuestion, requestNextQuestion, autoplay]);

    // Avance manual del host cuando autoplay está desactivado. En ANSWER_STATS
    // activamos el flag isTransitioning durante MODAL_TRANSITION_MS para que
    // AnimatePresence haga el intercambio stats↓ / ranking↑ con el botón en
    // pause/disabled. En RANKING el flag se queda activo hasta que el broadcast
    // del backend abre la siguiente pregunta (effect de serverQuestionIndex)
    const advanceView = useCallback(() => {
        if (isTransitioning) return;
        if (view === HOST_VIEWS.ANSWER_STATS) {
            setIsTransitioning(true);
            // En la última pregunta saltamos RANKING para no spoilear el podio final
            if (isLastQuestion) {
                finishMatch().catch(() => setIsTransitioning(false));
                return;
            }
            setView(HOST_VIEWS.RANKING);
            const timer = setTimeout(() => setIsTransitioning(false), MODAL_TRANSITION_MS);
            return () => clearTimeout(timer);
        }
        if (view === HOST_VIEWS.RANKING) {
            setIsTransitioning(true);
            if (isLastQuestion) {
                finishMatch().catch(() => setIsTransitioning(false));
            } else {
                requestNextQuestion();
            }
        }
    }, [view, isTransitioning, isLastQuestion, requestNextQuestion]);

    const canAdvance = !autoplay && !isTransitioning && (
        view === HOST_VIEWS.ANSWER_STATS ||
        view === HOST_VIEWS.RANKING
    );

    // Cuando el backend confirma que la partida ha terminado (finished=true via
    // broadcast matchFinished), transicionar a RESULTS
    useEffect(() => {
        if (!finished) return;
        setIsTransitioning(false);
        if (view === HOST_VIEWS.RESULTS) return;
        setView(HOST_VIEWS.RESULTS);
    }, [finished, view]);

    // matchRestarted resetea state.multiplayer.started/finished a false. El
    // gameSlice ya nos devuelve a screen=LOBBY por su extraReducer, pero la
    // view local del host puede haberse quedado en RESULTS (o en cualquier
    // pantalla anterior). Esto la fuerza a la apertura inicial para la
    // siguiente partida, además de limpiar los flags de transición y los
    // refs internos que controlan el flujo question→stats→ranking→next.
    useEffect(() => {
        if (started || finished) return;
        setView(HOST_VIEWS.QUESTION_STATEMENT);
        setIsTransitioning(false);
        skipInitialStartRef.current = false;
        prevServerIndexRef.current = null;
        resetAnsweredCount();
        resetRanking();
    }, [started, finished, resetAnsweredCount, resetRanking]);

    // ─── Acciones del controlador ────────────────────────────────────

    const handleSetDeadline = useCallback((seconds) => {
        if (!match?.id) return;
        // Si la acción falla (timeout WS, error del backend, S3 caído…) dejamos
        // traza en consola para que sea diagnosticable. La UI se autorrecupera:
        // hasActiveDeadline sigue en false (el broadcast questionDeadline no
        // llegó a actualizar Redux) y el botón vuelve a 'play-idle', así que
        // el host puede reintentar.
        setQuestionDeadline(seconds).catch((e) => {
            console.error('Error setting question deadline:', e);
        });
    }, [match?.id]);

    // El reinicio tarda unos segundos (el backend limpia backlogs WS, recrea
    // ws-rooms, persiste el estado…) y hasta que llega el broadcast
    // matchRestarted no hay nada visible en pantalla. Sin este flag el host
    // golpearía el botón varias veces — cada click dispara un restartMatch
    // adicional. Lo bloqueamos hasta que started/finished vuelvan a false (o
    // hasta un timeout de seguridad por si el broadcast nunca llega).
    const [isRestarting, setIsRestarting] = useState(false);

    const handleRestart = useCallback(() => {
        if (isRestarting) return;
        setIsRestarting(true);
        restartMatch().catch(() => setIsRestarting(false));
    }, [isRestarting]);

    useEffect(() => {
        if (!isRestarting) return;
        if (!started && !finished) {
            setIsRestarting(false);
            return;
        }
        const safety = setTimeout(() => setIsRestarting(false), 15000);
        return () => clearTimeout(safety);
    }, [isRestarting, started, finished]);

    // Salida del podio hacia "Mis Juegos" del host: marca la partida como
    // FINISHED en el backend (mismo flujo que ejecuta el cron de cleanup) y
    // luego navega al home, que redirige al perfil del usuario logueado.
    // Esperamos al resolver del WS antes de navegar: si redirigimos antes, la
    // desconexión puede abortar el envío y dejar la partida sin cerrar.
    const handleExit = useCallback(() => {
        closeMatch()
            .catch(() => {})
            .finally(() => {
                window.location.href = window.__EDUCAPLAY_MAIN_URL;
            });
    }, []);

    return {
        view,
        currentQuestion,
        displayedIndex,
        totalQuestions,
        totalPlayers,
        answeredCount,
        ranking,
        finalRanking,
        stats,
        isPaused,
        isLastQuestion,
        deadline,
        secondsLeft,
        handleCountdownFinish,
        setDeadline: handleSetDeadline,
        handleRestart,
        isRestarting,
        handleExit,
        advanceView,
        canAdvance,
        isTransitioning,
    };
}
