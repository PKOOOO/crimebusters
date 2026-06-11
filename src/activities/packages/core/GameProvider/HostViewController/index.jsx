import { useRef, useCallback, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import clsx from "clsx";
import { AnimatePresence } from "framer-motion";
import { HOST_VIEWS } from "@educaplay/store/constants";
import { useHostController } from "./useHostController";
import { QuestionScreen } from "./QuestionScreen";
import { RankingModal } from "./RankingModal";
import { AnswerStatsModal } from "./AnswerStatsModal";
import { ControllerButtons } from "./ControllerButtons";
import { QUESTION_COUNTDOWN_SECONDS } from "./constants";
import { useTranslate, useKickPlayerFlow, useGameSounds, useMatchBackground } from "@educaplay/core/hooks";
import { NAME_SOUND_ACTIVE_BANK, NAME_SOUND_INTRO } from "@educaplay/core";
import { Fill } from "@educaplay/core/components";
import { HostViewScore } from "../HostViewScore";
import { Bank } from "../Bank";
import { HostHeader } from "../HostHeader";
import { HostToolbarControls } from "../HostToolbarControls";
import { KickPlayerDialog } from "../Lobby/KickPlayerDialog";
import { MultiplayerExitDialog } from "../MultiplayerExitDialog";
import { PresenceBanner } from "../PresenceBanner";
import { WaitingForPlayersOverlay } from "../WaitingForPlayersOverlay";
import styles from "./HostViewController.module.scss";

export function HostViewController({ Game, gameImage}) {
    const gameRef = useRef(null);
    const bankRef = useRef(null);
    const t = useTranslate();
    const { play: playSound } = useGameSounds();
    const isFirstBankMoveRef = useRef(true);
    const isFirstStatsToggleRef = useRef(true);
    const isFirstRankingToggleRef = useRef(true);

    // Arranca la animación de entrada del Bank al montar para que pase a modo
    // "ready" y reaccione a los cambios de showBankControl que emite Phaser
    useEffect(() => {
        bankRef.current?.animateEntry?.();
    }, []);

    const {
        view,
        currentQuestion,
        displayedIndex,
        totalQuestions,
        totalPlayers,
        answeredCount,
        ranking,
        finalRanking,
        stats,
        deadline,
        secondsLeft,
        handleCountdownFinish,
        setDeadline,
        handleRestart,
        isRestarting,
        handleExit,
        advanceView,
        canAdvance,
        isTransitioning,
    } = useHostController(gameRef);

    // Reproduce el sonido del banco cada vez que cambia su estado "centrado".
    // Al ir al centro suena enunciado.mp3; al volver a su posición dentro del
    // juego suena intro.mp3 (acompaña el inicio efectivo de la pregunta). En el
    // primer render lo dispara animateEntry, así que aquí lo saltamos para no
    // duplicar el sonido
    const isBankCentered = view === HOST_VIEWS.QUESTION_STATEMENT;
    useEffect(() => {
        if (isFirstBankMoveRef.current) {
            isFirstBankMoveRef.current = false;
            return;
        }
        playSound(isBankCentered ? NAME_SOUND_ACTIVE_BANK : NAME_SOUND_INTRO);
    }, [isBankCentered, playSound]);

    // Mismo sonido al mostrar y ocultar el modal de estadísticas de respuesta
    const isStatsActive = view === HOST_VIEWS.ANSWER_STATS;
    useEffect(() => {
        if (isFirstStatsToggleRef.current) {
            isFirstStatsToggleRef.current = false;
            return;
        }
        playSound(NAME_SOUND_ACTIVE_BANK);
    }, [isStatsActive, playSound]);

    // Mismo sonido al mostrar y ocultar el modal de ranking entre preguntas
    const isRankingActive = view === HOST_VIEWS.RANKING;
    useEffect(() => {
        if (isFirstRankingToggleRef.current) {
            isFirstRankingToggleRef.current = false;
            return;
        }
        playSound(NAME_SOUND_ACTIVE_BANK);
    }, [isRankingActive, playSound]);

    // Contador "Pregunta: X / total" del Bank en la vista del host. Mostramos
    // el índice de la pregunta en curso (1-based) en vez del de respondidas:
    // el host no responde, y la primera pregunta debe verse como 1/total.
    // Se inyecta vía Fill para sobrescribir el infoLeft del juego (single-player)
    const questionCounter = `${t('common.game.question')}: ${displayedIndex + 1} / ${totalQuestions}`;

    const activityTitle = useSelector(state => state.game.title);
    const matchPin = useSelector(state => state.multiplayer.match?.pin ?? null);
    const podiumBackground = useMatchBackground().src;

    const { kickTarget, requestKick, cancelKick, confirmKick } = useKickPlayerFlow();

    // Confirmación de salida del host: el botón "Volver a mi Perfil" abre el
    // modal y solo al aceptar disparamos handleExit (que cierra la partida y
    // redirige). Cerrar el modal con cancelar/escape vuelve al podio sin tocar
    // la partida
    const [exitConfirmOpen, setExitConfirmOpen] = useState(false);
    const requestExit = useCallback(() => setExitConfirmOpen(true), []);
    const cancelExit = useCallback(() => setExitConfirmOpen(false), []);
    const confirmExit = useCallback(() => {
        setExitConfirmOpen(false);
        handleExit();
    }, [handleExit]);

    const handleAnswer = useCallback(() => {
        // Host no responde - no-op
    }, []);

    return (
        <div className={styles.hostContainer}>
            <Fill name="core-bank-left">{questionCounter}</Fill>
            <HostHeader overlay />
            <PresenceBanner />
            <WaitingForPlayersOverlay />

            {view === HOST_VIEWS.QUESTION_STATEMENT && (
                <QuestionScreen
                    questionNumber={displayedIndex + 1}
                    totalQuestions={totalQuestions}
                    countdownSeconds={QUESTION_COUNTDOWN_SECONDS}
                    onCountdownFinish={handleCountdownFinish}
                    gameImage={gameImage}
                />
            )}

            <div className={styles.gameVisible}>
                <Game ref={gameRef} onAnswer={handleAnswer} />
                <div className={styles.clickBlocker} />
            </div>

            {view !== HOST_VIEWS.RESULTS && (
                <div className={clsx(
                    styles.bankWrapper,
                    view === HOST_VIEWS.QUESTION_STATEMENT && styles.bankWrapperCentered
                )}>
                    <Bank ref={bankRef} hasBank />
                </div>
            )}

            {/* AnimatePresence con mode="wait" para encadenar el exit del modal
                de stats (~400 ms) y el enter del de ranking (~400 ms): 800 ms
                totales con el botón en pause/disabled durante ese hueco */}
            <AnimatePresence mode="wait" initial={false}>
                {view === HOST_VIEWS.ANSWER_STATS && stats && (
                    <AnswerStatsModal
                        key="answer-stats"
                        stats={stats}
                        question={currentQuestion}
                        questionNumber={displayedIndex + 1}
                        totalQuestions={totalQuestions}
                    />
                )}

                {view === HOST_VIEWS.RANKING && ranking.length > 0 && (
                    <RankingModal key="ranking" ranking={ranking} onKick={requestKick} />
                )}
            </AnimatePresence>

            <KickPlayerDialog
                open={!!kickTarget}
                nickname={kickTarget?.nickname}
                onCancel={cancelKick}
                onConfirm={confirmKick}
            />

            {view === HOST_VIEWS.RESULTS && finalRanking.length > 0 && (
                <HostViewScore
                    ranking={finalRanking}
                    title={activityTitle}
                    backgroundImage={podiumBackground}
                    onRestart={handleRestart}
                    isRestarting={isRestarting}
                    onExit={requestExit}
                />
            )}

            <MultiplayerExitDialog
                open={exitConfirmOpen}
                onCancel={cancelExit}
                onConfirm={confirmExit}
            />

            <ControllerButtons
                view={view}
                matchPin={matchPin}
                totalPlayers={totalPlayers}
                displayedIndex={displayedIndex}
                totalQuestions={totalQuestions}
                answeredCount={answeredCount}
                deadline={deadline}
                secondsLeft={secondsLeft}
                onSetDeadline={setDeadline}
                canAdvance={canAdvance}
                onAdvance={advanceView}
                isTransitioning={isTransitioning}
            />

            <HostToolbarControls />
        </div>
    );
}
