import { useState, useEffect, useRef, useCallback } from "react";
import { useSelector } from "react-redux";
import clsx from "clsx";
import { motion } from "framer-motion";
import { HOST_VIEWS } from "@educaplay/store/constants";
import { useTranslate, useGameSounds } from "@educaplay/core/hooks";
import { toggleLock } from "@educaplay/core/services/multiplayer";
import { NAME_SOUND_HOVER, NAME_SOUND_ACTIVATE, NAME_SOUND_COUNTDOWN, NAME_SOUND_FINAL_COUNTDOWN } from "@educaplay/core";
import { FilledPlay } from "@educaplay/core/Icons/FilledPlay";
import { Pause } from "@educaplay/core/Icons/Pause";
import { User } from "@educaplay/core/Icons/User";
import { Check2 } from "@educaplay/core/Icons/Check2";
import { Multiplayer } from "@educaplay/core/Icons/Multiplayer";
import { Question } from "@educaplay/core/Icons/Question";
import styles from "./ControllerButtons.module.scss";

const DEADLINE_PRESETS = [10, 20, 30, 60];
const DEFAULT_DEADLINE_SECONDS = 10;

// SVG inline minimal (sólo maquetación; se promoverán a iconos reutilizables
// cuando el diseño esté aprobado)
const IconClock = () => (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
    </svg>
);

const IconCopy = () => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="9" y="9" width="11" height="11" rx="2" />
        <path d="M5 15V5a2 2 0 0 1 2-2h10" />
    </svg>
);

// Mismo SVG inline que LobbyHost; cuando el diseño esté aprobado se promoverá
// a icono reutilizable en ambos sitios
const IconLock = ({ locked }) => (
    locked ? (
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="4" y="11" width="16" height="10" rx="2" />
            <path d="M8 11V7a4 4 0 0 1 8 0v4" />
        </svg>
    ) : (
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="4" y="11" width="16" height="10" rx="2" />
            <path d="M8 11V7a4 4 0 0 1 7.5-2" />
        </svg>
    )
);

function DeadlineDropdown({ selectedSeconds, secondsLeft, hasActiveDeadline, disabled, onSelect }) {
    const t = useTranslate();
    const [open, setOpen] = useState(false);
    const rootRef = useRef(null);

    useEffect(() => {
        if (!open) return;
        const handle = (event) => {
            if (rootRef.current && !rootRef.current.contains(event.target)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handle);
        return () => document.removeEventListener("mousedown", handle);
    }, [open]);

    const handleSelect = useCallback((seconds) => {
        onSelect(seconds);
        setOpen(false);
    }, [onSelect]);

    const displayValue = hasActiveDeadline ? secondsLeft : selectedSeconds;

    return (
        <div className={styles.dropdown} ref={rootRef}>
            <div className={styles.dropdownLabel}>
                <span className={styles.dropdownLabelTitle}>{t('common.multiplayer.controller.lastRound')}</span>
                <button
                    type="button"
                    className={clsx(
                        styles.dropdownLabelValue,
                        hasActiveDeadline && styles.dropdownLabelValueActive,
                    )}
                    onClick={() => setOpen(prev => !prev)}
                    aria-expanded={open}
                    disabled={disabled}
                >
                    <IconClock />
                    {`${displayValue} s.`}
                    <svg viewBox="0 0 10 6" width="10" height="6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="m1 1 4 4 4-4" />
                    </svg>
                </button>
            </div>
            {open && (
                <div className={styles.dropdownMenu} role="menu">
                    {DEADLINE_PRESETS.map(seconds => (
                        <button
                            key={seconds}
                            type="button"
                            className={styles.dropdownItem}
                            onClick={() => handleSelect(seconds)}
                            role="menuitem"
                        >
                            {seconds} s.
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

export function ControllerButtons(props) {
    const {
        view,
        matchPin,
        totalPlayers,
        displayedIndex,
        // totalQuestions,
        answeredCount,
        deadline,
        secondsLeft,
        onSetDeadline,
        canAdvance,
        onAdvance,
        isTransitioning,
    } = props;

    const t = useTranslate();
    const gameSounds = useGameSounds();
    const [copied, setCopied] = useState(false);
    const [selectedSeconds, setSelectedSeconds] = useState(DEFAULT_DEADLINE_SECONDS);
    const locked = useSelector(state => state.multiplayer.match?.locked ?? false);

    const handleToggleLock = useCallback(async () => {
        try {
            await toggleLock(!locked);
        } catch (e) {
            console.error('Error toggling lock:', e);
        }
    }, [locked]);

    const hasActiveDeadline = deadline != null && secondsLeft != null;

    // Mismo umbral que CountdownTimer/CountdownTimerPill: aviso sonoro en los
    // últimos segundos del countdown (3/5/10/20/30 según la duración elegida)
    const timeLimit = selectedSeconds <= 10 ? 3
        : selectedSeconds <= 30 ? 5
        : selectedSeconds <= 60 ? 10
        : selectedSeconds <= 180 ? 20
        : 30;

    useEffect(() => {
        if (!hasActiveDeadline || secondsLeft == null) return;
        if (secondsLeft > timeLimit) return;
        if (secondsLeft === 0) {
            gameSounds.play(NAME_SOUND_FINAL_COUNTDOWN);
        } else {
            gameSounds.play(NAME_SOUND_COUNTDOWN);
        }
    }, [secondsLeft, hasActiveDeadline, timeLimit, gameSounds]);

    const handleCopyPin = useCallback(() => {
        if (!matchPin) return;
        navigator.clipboard.writeText(String(matchPin)).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    }, [matchPin]);

    const handleStartDeadline = useCallback(() => {
        if (hasActiveDeadline) return;
        onSetDeadline(selectedSeconds);
    }, [hasActiveDeadline, selectedSeconds, onSetDeadline]);

    // Estado visual del botón play/pause según la fase del flujo. Tres modos:
    //   - 'play-idle': respondiendo sin cuenta atrás → arranca el deadline
    //   - 'play-paused': host detenido en stats/ranking esperando avance manual
    //     (icono play en variante --secondary)
    //   - 'pause-running': cuenta atrás en marcha o transición entre pantallas
    //     (icono pause, deshabilitado)
    let playMode;
    if (canAdvance) {
        playMode = 'play-paused';
    } else if (view === HOST_VIEWS.GAME_VIEW && !hasActiveDeadline && !isTransitioning) {
        playMode = 'play-idle';
    } else {
        playMode = 'pause-running';
    }

    const baseHandlePlayClick = playMode === 'play-paused'
        ? onAdvance
        : handleStartDeadline;
    const isPlayDisabled = playMode === 'pause-running';
    const handlePlayClick = useCallback(() => {
        gameSounds.play(NAME_SOUND_ACTIVATE);
        baseHandlePlayClick();
    }, [gameSounds, baseHandlePlayClick]);
    const handlePlayHover = useCallback(() => {
        if (isPlayDisabled) return;
        gameSounds.play(NAME_SOUND_HOVER);
    }, [gameSounds, isPlayDisabled]);
    const playAriaLabel = playMode === 'play-paused'
        ? t('common.multiplayer.controller.next')
        : t('common.multiplayer.controller.startCountdown');
    const PlayIcon = playMode === 'pause-running' ? Pause : FilledPlay;

    // El selector de duración sólo aporta valor mientras el host puede arrancar
    // o está consumiendo la cuenta atrás de la pregunta actual. En cuanto termina
    // el countdown (la vista pasa a CORRECT_ANSWER y posteriores) lo ocultamos
    const showDeadlineDropdown = view === HOST_VIEWS.QUESTION_STATEMENT || view === HOST_VIEWS.GAME_VIEW;

    if (view === HOST_VIEWS.RESULTS) {
        return null;
    }

    return (
        <div className={styles.toolbar}>
            {/* Entrada de abajo hacia arriba al montar el cuadro de mandos del
                host cuando comienza la partida. Mismo patrón que el reloj del
                footer (Footer/index.jsx): y 120% → 0 + fade en 300ms */}
            <motion.div
                className={styles.statsGroup}
                initial={{ y: "120%", opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.3, ease: "easeOut", delay: 0.4 }}
            >
                <div className={styles.controllerControls}>
                    {showDeadlineDropdown && (
                        <DeadlineDropdown
                            selectedSeconds={selectedSeconds}
                            secondsLeft={secondsLeft}
                            hasActiveDeadline={hasActiveDeadline}
                            disabled={hasActiveDeadline}
                            onSelect={setSelectedSeconds}
                        />
                    )}

                    <button
                        type="button"
                        className={clsx(
                            styles.iconButton,
                            playMode === 'play-paused' && styles.iconButtonSecondary,
                        )}
                        onClick={handlePlayClick}
                        onMouseEnter={handlePlayHover}
                        disabled={isPlayDisabled}
                        aria-label={playAriaLabel}
                    >
                        <PlayIcon />
                    </button>
                </div>
                {matchPin != null && (
                    <div className={styles.pinSection}>
                        <button
                            type="button"
                            className={clsx(styles.lockButton, locked && styles.lockButtonActive)}
                            onClick={handleToggleLock}
                            aria-label={locked ? t('common.multiplayer.lobby.unlock') : t('common.multiplayer.lobby.lock')}
                            title={locked ? t('common.multiplayer.lobby.unlock') : t('common.multiplayer.lobby.lock')}
                        >
                            <IconLock locked={locked} />
                        </button>
                        <span className={styles.pinIcon} aria-hidden="true">
                            <Multiplayer size={32} />
                        </span>
                        <span className={styles.pinValue}>{matchPin}</span>
                        <button
                            type="button"
                            className={styles.copyButton}
                            onClick={handleCopyPin}
                            aria-label={t('common.multiplayer.gamePin.copyTitle')}
                            title={copied ? t('common.multiplayer.gamePin.copied') : t('common.multiplayer.gamePin.copyTitle')}
                        >
                            <IconCopy />
                        </button>
                    </div>
                )}
                <div className={styles.statBlock}>
                    <span className={styles.statLabel}>{t('common.multiplayer.controller.players')}</span>
                    <div className={styles.statBox}>
                        <span className={styles.statIcon}>
                            <User size={18} />
                        </span>
                        <span className={styles.statValue}>{totalPlayers}</span>
                    </div>
                </div>
                <div className={styles.progressGroup}>
                    <div className={styles.statBlock}>
                        <span className={styles.statLabel}>{t('common.multiplayer.controller.question')}</span>
                        <div className={styles.statBox}>
                            <span className={styles.statIcon}>
                                <Question size={18} />
                            </span>
                            <span className={styles.statValue}>{displayedIndex + 1}</span>
                        </div>
                    </div>
                    <div className={styles.statBlock}>
                        <span className={styles.statLabel}>{t('common.multiplayer.controller.answers')}</span>
                        <div className={styles.statBox}>
                            <span className={styles.statIcon}>
                                <Check2 size={18} />
                            </span>
                            <span className={styles.statValue}>{answeredCount}</span>
                        </div>
                    </div>
                </div>
            </motion.div>

        </div>
    );
}
