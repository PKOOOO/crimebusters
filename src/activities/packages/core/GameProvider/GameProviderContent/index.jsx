import { useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import { useSelector, useDispatch } from "react-redux";
import { ExitDialog } from "../ExitDialog";
import { Bank } from "../Bank";
import { Header } from "../Header";
import { Footer } from "../Footer";
import {
  answerQuestion,
  finishEntryAnimation,
  finishGame,
  incrementTime,
  setAnimating,
} from "@educaplay/store/slices/gameSlice";
import {
  useGameSounds,
  useGameAnimations,
  ProgressBar,
  VisualFeedback,
} from "@educaplay/core";
import { useMultiplayer } from "@educaplay/core/hooks";
import {
  NAME_SOUND_SUCCESS,
  NAME_SOUND_FAILURE,
  NAME_SOUND_LIVE,
  NAME_ANIMATION_LIVES,
  NAME_ANIMATION_POINTS,
} from "@educaplay/core/utils";
import { GameLayout } from "../GameLayout";
import { SCREENS } from "@educaplay/store/constants";
import { useState } from "react";
import { FeedbackDialog } from "../FeedbackDialog";
import { isUnansweredAnswer } from "@educaplay/store/utils/functions";
import classes from "./GameProviderContent.module.scss";
import { AnimatePresence } from "framer-motion";
import { useMultiplayerAnswer } from "./useMultiplayerAnswer";
import { useMultiplayerSync } from "./useMultiplayerSync";
import { useMultiplayerRehydrateAnswer } from "./useMultiplayerRehydrateAnswer";
import { PlayerPointsModal } from "./PlayerPointsModal";
import { WaitingForOthersBanner } from "../WaitingForOthersBanner";
import { AnswerResultBanner } from "../AnswerResultBanner";

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const GameProviderContent = forwardRef(function GameProviderContent(
  props,
  ref
) {
  const { Game, hasCustomLayout, classes: customClasses } = props;

  const visualFeedbackRef = useRef(null);
  const gameRef = useRef(null);
  const headerRef = useRef(null);
  const footerRef = useRef(null);
  const bankRef = useRef(null);

  const { isPlayer } = useMultiplayer();

  // En multiplayer (lado player) no se muestra el banco: la pregunta la presenta el host
  const hasBank = useSelector((state) => {
    if (state.game.isBankHidden) return false;

    if (state.game.hasQuestionBank) {
      const question = state.game.questions[state.game.currentIndex];
      return !!question?.bank;
    }
    return state.game.hasBank;
  }) && !isPlayer;

  const questions = useSelector((state) => state.game.questions);
  const currentIndex = useSelector((state) => state.game.currentIndex);
  const liveActived = useSelector((state) => state.game.liveActived);
  const screen = useSelector((state) => state.game.view);
  const countFooterSpace = useSelector((state) => state.game.countFooterSpace);
  const showFeedbackGame = useSelector((state) => state.game.showFeedbackGame);
  const semiCorrect = useSelector((state) => state.game.semiCorrect);
  const hasProgressBar = useSelector((state) => state.game.hasProgressBar);
  const isExamMode = useSelector((state) => state.game.examMode);
  const isPaused = useSelector((state) => state.game.isPaused);
  const playerQuestionPhase = useSelector((state) => state.multiplayer.question?.phase ?? null);
  const playerHasAnswered = useSelector((state) => {
    const idx = state.multiplayer.question?.index;
    if (idx == null) return false;
    return state.game.questions[idx]?.answer != null;
  });
  const playerDeadline = useSelector((state) => state.multiplayer.question?.deadline ?? null);
  // Cuando el autor desactiva el reloj (MOSTRAR_TIEMPO="no") no se muestra ningún reloj
  const showClock = useSelector((state) => state.game.showClock);
  // En modo player solo mostramos el reloj cuando el host ha fijado un deadline
  // para la pregunta actual y el jugador aún está respondiendo. Sin deadline el
  // reloj no debe aparecer (entrará/saldrá con animación cuando cambie)
  const showFooterClock = showClock && (!isPlayer || (playerQuestionPhase === 'answering' && !playerHasAnswered && playerDeadline != null));
  const [feedbackQuestionIndex, setFeedbackQuestionIndex] = useState(null);

  const answeredQuestions = questions.filter((question) =>
    hasProgressBar.onlyCorrect
      ? !isUnansweredAnswer(question.answer, { examMode: isExamMode }) &&
        question?.checkAnswer?.(question.answer)
      : !isUnansweredAnswer(question.answer, { examMode: isExamMode })
  );
  const progressPercent = (answeredQuestions.length / questions.length) * 100;

  const dispatch = useDispatch();
  const gameSounds = useGameSounds();
  const gameAnimations = useGameAnimations();
  const [isInitGame, setIsInitGame] = useState(false);

  useMultiplayerRehydrateAnswer();
  useMultiplayerAnswer();
  useMultiplayerSync(gameRef);

  const [answerData, setAnswerData] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);

  useImperativeHandle(ref, () => ({
    animateExit: async () => {
      await footerRef.current.animateExit();
      bankRef.current?.animateExit();
      await gameRef.current?.animateExit?.();
      await headerRef.current.animateExit({ delay: 0.3 });
    },
  }));

  const handleAnswer = async (answer, params = {}) => {
    // NOTE: Phaser already blocks multiple clicks with its own check (this.moving || this.finish)
    // so we don't need to check isAnimating here - it would cause false positives
    dispatch(setAnimating(true));

    const questionIndex = params.questionIndexAnswer ?? currentIndex;

    // En multijugador (jugador) no validamos localmente: el servidor es la
    // fuente de verdad. Solo registramos la respuesta cruda y useMultiplayerAnswer
    // se encargará de enviarla al backend y recibir el resultado autoritativo.
    if (isPlayer) {
      dispatch(setAnimating(false));
      dispatch(answerQuestion({
        answer,
        isCorrect: false,
        points: 0,
        nextQuestionIndex: questionIndex,
        questionIndexAnswer: params.questionIndexAnswer,
        skipResult: true,
      }));
      return;
    }

    const currentQuestion =
      questions[questionIndex];

    const isCorrect = currentQuestion?.checkAnswer?.(answer) ?? false;
    const hasCustomPoints =
      typeof currentQuestion?.calculatePoints === "function";
    const points = hasCustomPoints
      ? currentQuestion.calculatePoints(answer, currentQuestion)
      : currentQuestion?.points ?? 0;

    const playErrorSound = params.playErrorSound ?? true;

    await wait(400);
    if (isCorrect) {
      gameSounds.play(NAME_SOUND_SUCCESS);
      gameAnimations.start(NAME_ANIMATION_POINTS, { value: points });
    } else {
      if (semiCorrect && points > 0) {
        gameSounds.play(NAME_SOUND_SUCCESS);
        gameAnimations.start(NAME_ANIMATION_POINTS, { value: points });
      }
      if (playErrorSound) gameSounds.play(NAME_SOUND_FAILURE);

      if (liveActived) {
        setTimeout(() => {
          gameAnimations.start(NAME_ANIMATION_LIVES);
          gameSounds.play(NAME_SOUND_LIVE);
        }, params.delayLiveAnimation ?? 0);
      }
    }

    const executeVisualFeedback = async () => {
      const defaultDuration = isCorrect ? 100 : 200;
      const duration = params.feedbackDuration ?? defaultDuration;
      await visualFeedbackRef.current?.show({ isCorrect, duration });
    };

    if (params.showFeedback) {
      await executeVisualFeedback();
    } else if (!isCorrect && liveActived) {
      await executeVisualFeedback();
    }

    const formattedAnswerData = {
      answer,
      isCorrect,
      points,
      semiCorrect,
      nextQuestionIndex: params.nextQuestionIndex,
      questionIndexAnswer: params.questionIndexAnswer,
    };

    await wait(200);

    if (
      currentQuestion?.feedback &&
      ((showFeedbackGame?.isCorrect && isCorrect) ||
        (showFeedbackGame?.isError && !isCorrect))
    ) {
      setShowFeedback(true);
      setAnswerData(formattedAnswerData);
      setFeedbackQuestionIndex(params.questionIndexAnswer ?? currentIndex);
      return;
    }

    if (typeof params.onBeforeAdvance === "function") {
      await params.onBeforeAdvance();
    }

    dispatch(setAnimating(false));
    dispatch(answerQuestion(formattedAnswerData));
  };

  const onCloseFeedbackHandler = () => {
    dispatch(setAnimating(false));
    dispatch(
      answerQuestion({
        ...answerData,
        questionIndexAnswer: feedbackQuestionIndex,
      })
    );
    setAnswerData(null);
    setShowFeedback(false);
    setFeedbackQuestionIndex(null);
  };

  const handleTimeFinish = async () => {
    dispatch(setAnimating(true));
    gameSounds.play(NAME_SOUND_FAILURE);

    const {
      data: answer = "",
      isCorrect = false,
      points = 0,
      nextQuestionIndex,
      shouldFinish = false,
    } = gameRef.current?.getUserAnswer?.() ?? {};

    await visualFeedbackRef.current?.show({ isCorrect, duration: 200 });
    await wait(200);
    await gameRef.current?.animateFail?.();

    await wait(200);
    if (!isCorrect && liveActived) {
      gameAnimations.start(NAME_ANIMATION_LIVES);
      gameSounds.play(NAME_SOUND_LIVE);
    }
    await wait(400);

    dispatch(setAnimating(false));

    if (shouldFinish) {
      dispatch(finishGame());
      return;
    }

    dispatch(answerQuestion({ answer, isCorrect, points, semiCorrect, nextQuestionIndex }));
  };

  useEffect(() => {
    if (screen !== SCREENS.GAME) return;

    const initAnimation = async () => {
      setIsInitGame(false);
      dispatch(setAnimating(true));

      await headerRef.current.animateEntry();
      await gameRef.current.animateEntry();
      bankRef.current?.animateEntry();
      await footerRef.current.animateEntry();
      setIsInitGame(true);
      dispatch(finishEntryAnimation());
      dispatch(setAnimating(false));
    };
    initAnimation();
  }, [dispatch, screen]);

  useEffect(() => {
    if (screen !== SCREENS.GAME || !isInitGame || isPaused) return;

    const interval = setInterval(() => {
      dispatch(incrementTime());
    }, 1000);
    return () => clearInterval(interval);
  }, [screen, dispatch, isInitGame, isPaused]);

  return (
    <GameLayout
      hasBank={hasBank}
      countFooterSpace={countFooterSpace}
      hasCustomLayout={hasCustomLayout}
      className={customClasses?.layout}
    >
      <ExitDialog />
      <Header animated ref={headerRef} />
      <AnimatePresence>
        {hasProgressBar.view && screen === SCREENS.GAME && (
          <ProgressBar
            className={classes.progressBarPosition}
            value={progressPercent}
          />
        )}
      </AnimatePresence>
      {isPlayer
        ? <div aria-hidden="true" />
        : <Bank hasBank={hasBank} ref={bankRef} className={customClasses?.bank} />
      }

      <FeedbackDialog
        open={showFeedback}
        onClose={onCloseFeedbackHandler}
        question={questions[feedbackQuestionIndex] ?? questions[currentIndex]}
      />
      <Game ref={gameRef} onAnswer={handleAnswer} />

      <PlayerPointsModal />
      <WaitingForOthersBanner />
      <AnswerResultBanner />

      <VisualFeedback ref={visualFeedbackRef} />
      <Footer
        animated
        ref={footerRef}
        showClock={showFooterClock}
        clockFreezed={screen !== SCREENS.GAME || isPaused}
        onTimeFinish={handleTimeFinish}
      />
    </GameLayout>
  );
});
