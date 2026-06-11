import { useImperativeHandle, useRef, useCallback, useEffect, useLayoutEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  setAnimating,
  goToQuestion,
  setShowBankControl,
  setBankOffsetY,
} from "@educaplay/store/slices/gameSlice";
import { SCREENS } from "@educaplay/store/constants";
import { assetsUrl } from "@educaplay/core";
import { useMultiplayer, useGameSounds } from "@educaplay/core/hooks";
import classes from "./Game.module.scss";
import PhaserGame from "./PhaserGame";
import PlayerAnswerModal from "./components/PlayerAnswerModal";

export default function Game({ onAnswer, ref }) {
  const dispatch = useDispatch();
  const phaserGameRef = useRef(null);
  const { isHost, isPlayer } = useMultiplayer();
  const { soundActive } = useGameSounds();

  const questions = useSelector((state) => state.game.questions);
  const currentIndex = useSelector((state) => state.game.currentIndex);
  // play=true cuando el slice ya ha ejecutado startGame() (questions barajadas y view=GAME).
  // Mientras no sea true, PhaserGame solo monta canvas y precarga assets.
  const play = useSelector((state) => state.game.view === SCREENS.GAME);
  const isPaused = useSelector((state) => state.game.isPaused);
  // Mientras el menú de Settings está abierto desactivamos la interacción
  // del canvas: el overlay React no siempre intercepta el clic y, sin esto,
  // puede llegar a Phaser y disparar una respuesta en el nenúfar debajo.
  const settingsOpen = useSelector((state) => state.settings.isOpen);

  // En multijugador (player) la animación de la rana se difiere hasta que el
  // servidor cierre la pregunta (todos han contestado). Esperamos a que llegue
  // el answerResult autoritativo y entonces disparamos la animación con el
  // isCorrect del backend
  const multiplayerQuestionIndex = useSelector(
    (state) => state.multiplayer.question?.index ?? null,
  );
  const multiplayerQuestionPhase = useSelector(
    (state) => state.multiplayer.question?.phase ?? null,
  );
  const pendingAnswerResult = useSelector((state) => {
    if (!isPlayer) return null;
    if (multiplayerQuestionPhase !== "closed") return null;
    if (multiplayerQuestionIndex == null) return null;
    const question = state.game.questions[multiplayerQuestionIndex];
    // Solo hay animación pendiente si el jugador respondió con una opción
    // válida. En timeout (sin respuesta) el modal de puntos sale directo
    const answerPayload = question?.answer;
    const playerSelected = answerPayload
      && typeof answerPayload === "object"
      && typeof answerPayload.selectedOption === "string";
    if (!playerSelected) return null;
    return question?.answerResult ?? null;
  });
  const playedForIndexRef = useRef(null);

  // useLayoutEffect para que el setAnimating(true) que dispara la escena
  // se aplique antes del paint y el PlayerPointsModal no se vea durante un
  // frame entre phase=closed y el arranque de la animación
  useLayoutEffect(() => {
    if (!isPlayer) return;
    if (!pendingAnswerResult) return;
    if (multiplayerQuestionIndex == null) return;
    if (playedForIndexRef.current === multiplayerQuestionIndex) return;
    playedForIndexRef.current = multiplayerQuestionIndex;
    dispatch(setAnimating(true));
    phaserGameRef.current?.playPendingAnswerAnimation?.(
      pendingAnswerResult.isCorrect,
    );
  }, [isPlayer, pendingAnswerResult, multiplayerQuestionIndex, dispatch]);

  // Al entrar a una nueva pregunta reseteamos el guardia para permitir disparar
  // la animación de nuevo en la siguiente
  useEffect(() => {
    if (multiplayerQuestionPhase === "answering") {
      playedForIndexRef.current = null;
    }
  }, [multiplayerQuestionPhase, multiplayerQuestionIndex]);

  // En multijugador (host) la rana salta hacia la respuesta correcta cuando
  // el servidor cierra la pregunta (todos los players han contestado)
  useLayoutEffect(() => {
    if (!isHost) return;
    if (multiplayerQuestionPhase !== "closed") return;
    if (multiplayerQuestionIndex == null) return;
    if (playedForIndexRef.current === multiplayerQuestionIndex) return;
    playedForIndexRef.current = multiplayerQuestionIndex;
    dispatch(setAnimating(true));
    phaserGameRef.current?.playCorrectAnswerAnimation?.();
  }, [isHost, multiplayerQuestionPhase, multiplayerQuestionIndex, dispatch]);

  // Handle animating state changes from Phaser
  const handleAnimatingChange = useCallback(
    (isAnimating) => {
      dispatch(setAnimating(isAnimating));
    },
    [dispatch],
  );

  // Sync store's currentIndex when Phaser starts a new question
  const handleQuestionStart = useCallback(
    (storeIndex) => {
      dispatch(goToQuestion(storeIndex));
    },
    [dispatch],
  );

  const handleBankControl = useCallback(
    ({ visible = true, offsetY = 0 } = {}) => {
      dispatch(setShowBankControl(visible));
      dispatch(setBankOffsetY(offsetY));
    },
    [dispatch],
  );

  // Handle answer from Phaser
  const handleAnswer = useCallback(
    (answer, options = {}) => {
      // Sync Redux's currentIndex to Phaser's view BEFORE answerQuestion runs.
      // This ensures answerQuestion always reads the correct currentIndex
      // (e.g. for tries.push), regardless of any prior drift.
      if (options.questionIndexAnswer !== undefined) {
        dispatch(goToQuestion(options.questionIndexAnswer));
      }
      if (onAnswer) {
        onAnswer(answer, {
          showFeedback: false,
          playErrorSound: false,
          ...options,
        });
      }
    },
    [onAnswer, dispatch],
  );

  // Handle pause/resume when isPaused state changes
  useEffect(() => {
    if (phaserGameRef.current) {
      if (isPaused && phaserGameRef.current.pause) {
        phaserGameRef.current.pause();
      } else if (!isPaused && phaserGameRef.current.resume) {
        phaserGameRef.current.resume();
      }
    }
  }, [isPaused]);

  // Sincronizar Phaser cuando el store cambia de pregunta (e.g. goToQuestion
  // externo desde GameProvider, DebugWebsocketProvider, etc.)
  useEffect(() => {
    if (currentIndex == null || !phaserGameRef.current?.goToQuestion) return;
    phaserGameRef.current.goToQuestion(currentIndex);
  }, [currentIndex]);

  useImperativeHandle(
    ref,
    () => ({
      animateEntry: async () => {
        // Entry animation is handled by Phaser internally
        return Promise.resolve();
      },
      goToQuestion: (index) => {
        if (phaserGameRef.current?.goToQuestion) {
          phaserGameRef.current.goToQuestion(index);
        }
      },
      animateFail: async () => {
        // Fail animation triggered from React (e.g., timeout)
        if (phaserGameRef.current) {
          phaserGameRef.current.triggerTimeOut();
        }
        return Promise.resolve();
      },
      getUserAnswer: () => {
        // Sincronizamos currentIndex de Redux a la pregunta que está caducando
        // ANTES de que handleTimeFinish dispatche answerQuestion, para que se
        // registre como "no contestada" en la pregunta correcta y no se pise
        // la siguiente cuando Phaser avance el respawn.
        const scene = phaserGameRef.current?.getScene?.();
        const currentStoreIdx = scene?.getCurrentStoreIndex?.();
        const nextStoreIdx = scene?.getNextStoreIndex?.();
        if (currentStoreIdx !== undefined && currentStoreIdx !== null) {
          dispatch(goToQuestion(currentStoreIdx));
        }
        return {
          data: "",
          isCorrect: false,
          points: 0,
          nextQuestionIndex: nextStoreIdx,
        };
      },
      animateExit: async () => {
        // Signal game-over to Phaser and resolve quickly.
        // Avoid blocking SCORE_SCREEN on long Phaser animations.
        return new Promise((resolve) => {
          let settled = false;

          const finish = () => {
            if (settled) return;
            settled = true;
            resolve();
          };

          const fallback = setTimeout(() => {
            finish();
          }, 1000);

          if (phaserGameRef.current?.setGameOver) {
            const scene = phaserGameRef.current.getScene?.();

            // If scene is already finishing, don't wait for callbacks.
            if (scene?.finish) {
              clearTimeout(fallback);
              finish();
              return;
            }

            phaserGameRef.current.setGameOver(() => {
              clearTimeout(fallback);
              finish();
            });
          } else {
            clearTimeout(fallback);
            finish();
          }
        });
      },
    }),
    [dispatch],
  );

  return (
    <div className={classes.gameContainer}>
      <PlayerAnswerModal />
      <div className={classes.phaserCanvas}>
        <PhaserGame
          ref={phaserGameRef}
          questions={questions}
          onAnswer={handleAnswer}
          onAnimatingChange={handleAnimatingChange}
          onQuestionStart={handleQuestionStart}
          onBankControl={handleBankControl}
          assetsUrl={assetsUrl}
          soundEnabled={soundActive}
          randomizeAnswers={false}
          play={play}
          startIndex={currentIndex ?? 0}
          isHost={isHost}
          isPlayer={isPlayer}
          uiBlocked={settingsOpen}
        />
      </div>
    </div>
  );
}
