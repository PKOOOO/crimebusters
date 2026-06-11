import { useState, useCallback, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import clsx from 'clsx';
import { startGame } from '@educaplay/store/slices/gameSlice';
import { shuffle } from '@educaplay/store/utils/shuffle';
import { buildOrders } from '@educaplay/store/utils/applyOrders';
import { mergeSettingsCatalog, buildDefaultSettings } from './settingsCatalog';
import { useTranslate, useGameSounds, useKickPlayerFlow, useMatchBackground } from '@educaplay/core/hooks';
import { FilledPlay } from '@educaplay/core/Icons/FilledPlay';
import { HostHeader } from '../HostHeader';
import { HostToolbarControls } from '../HostToolbarControls';
import { GamePin } from './GamePin';
import { WaitingRoom } from './WaitingRoom';
import { Countdown } from './Countdown';
import { LobbySettings } from './LobbySettings';
import { KickPlayerDialog } from './KickPlayerDialog';
import { startMatch, toggleLock } from '@educaplay/core/services/multiplayer';
import { assetsUrl } from '../../utils';
import styles from './Lobby.module.scss';

const defaultBgImage = assetsUrl('common/background.png');
const lobbyMusicUrl = assetsUrl('common/lobbymusic.mp3');

const MIN_PLAYERS_TO_START = 1;

const EASE_OUT_EXPO = [0.16, 1, 0.3, 1];
const EASE_IN_EXPO  = [0.7, 0, 0.84, 0];

const containerVariants = {
    hidden:  { opacity: 1 },
    visible: { opacity: 1, transition: { when: 'beforeChildren', staggerChildren: 0.09, delayChildren: 0.05 } },
    exit:    { opacity: 0, y: -24, transition: { duration: 0.45, ease: EASE_IN_EXPO } },
};

const itemVariants = {
    hidden:  { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE_OUT_EXPO } },
};

const reducedContainerVariants = {
    hidden:  { opacity: 1 },
    visible: { opacity: 1, transition: { when: 'beforeChildren', staggerChildren: 0 } },
    exit:    { opacity: 0, transition: { duration: 0.2 } },
};

const reducedItemVariants = {
    hidden:  { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.2 } },
};

// SVG inline (mismo patrón que ControllerButtons: se promoverá a icono
// reutilizable cuando el diseño esté aprobado)
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

export function LobbyHost() {
    const t = useTranslate();
    const dispatch = useDispatch();
    const players = useSelector(state => state.multiplayer.players);
    const started = useSelector(state => state.multiplayer.started);
    const finished = useSelector(state => state.multiplayer.finished);
    const settings = useSelector(state => state.multiplayer.settings);
    const gameSettings = useSelector(state => state.game.multiplayerSettings);
    const questions = useSelector(state => state.game.questions);

    // Settings efectivos = defaults del catálogo + lo que el host haya tocado.
    // El store solo guarda los toggles modificados explícitamente (el backend
    // los inicializa vacíos), así que sin aplicar los defaults aquí las opciones
    // activadas por defecto (randomizeQuestions/Answers) nunca se aplicarían al
    // arrancar si el host no abre el panel de opciones. Mismo merge que LobbySettings.
    const effectiveSettings = useMemo(() => {
        const catalog = mergeSettingsCatalog({
            gameCatalog: gameSettings?.catalog ?? [],
            disabledCoreSettings: gameSettings?.disabledCoreSettings ?? [],
        });
        return { ...buildDefaultSettings(catalog), ...(settings ?? {}) };
    }, [gameSettings?.catalog, gameSettings?.disabledCoreSettings, settings]);
    const [starting, setStarting] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);
    // Forzamos el tooltip de "mínimo de jugadores" durante unos segundos tras
    // un click para que también funcione en táctil (donde no hay hover)
    const [minPlayersTooltipClicked, setMinPlayersTooltipClicked] = useState(false);
    const minPlayersTooltipTimeoutRef = useRef(null);
    const { kickTarget, requestKick, cancelKick, confirmKick } = useKickPlayerFlow();

    const locked = useSelector(state => state.multiplayer.match?.locked ?? false);
    const { soundActive } = useGameSounds();
    const reduceMotion = useReducedMotion();

    const variants = useMemo(() => (
        reduceMotion
            ? { container: reducedContainerVariants, item: reducedItemVariants }
            : { container: containerVariants, item: itemVariants }
    ), [reduceMotion]);

    // WS gestionado por WebSocketProvider a nivel superior. Las desconexiones
    // de players llegan vía broadcast 'playerDisconnected', no por polling.

    const handleStart = useCallback(async () => {
        if (players.length < MIN_PLAYERS_TO_START) {
            // Mostrar el tooltip ~3s aunque el usuario aparte el cursor; al
            // siguiente click se reinicia el temporizador
            setMinPlayersTooltipClicked(true);
            if (minPlayersTooltipTimeoutRef.current) {
                clearTimeout(minPlayersTooltipTimeoutRef.current);
            }
            minPlayersTooltipTimeoutRef.current = setTimeout(() => {
                setMinPlayersTooltipClicked(false);
                minPlayersTooltipTimeoutRef.current = null;
            }, 3000);
            return;
        }

        setStarting(true);
        try {
            // El host calcula questionOrder y answerOrders (comunes a todos) y
            // los envía al backend. Backend los persiste en Redis y los
            // broadcast en matchStarted para que todos los clientes apliquen
            // exactamente el mismo orden
            const { questionOrder, answerOrders } = buildOrders({
                questions,
                shuffleFn: shuffle,
                randomizeQuestions: !!effectiveSettings.randomizeQuestions,
                randomizeAnswers: !!effectiveSettings.randomizeAnswers,
            });
            await startMatch({ questionOrder, answerOrders });
        } catch (e) {
            setStarting(false);
        }
    }, [players.length, questions, effectiveSettings.randomizeQuestions, effectiveSettings.randomizeAnswers]);

    const handleToggleLock = useCallback(async () => {
        try {
            await toggleLock(!locked);
        } catch (e) {
            console.error('Error toggling lock:', e);
        }
    }, [locked]);

    const handleCountdownFinish = useCallback(() => {
        dispatch(startGame());
    }, [dispatch]);

    const handleOpenSettings = useCallback(() => {
        setSettingsOpen(true);
    }, []);

    // Si la partida ya terminó (reconexión con status RESULTS), saltar
    // directamente al juego sin mostrar el countdown
    useLayoutEffect(() => {
        if (started && finished) {
            dispatch(startGame());
        }
    }, [started, finished, dispatch]);

    // Música de fondo en bucle mientras el host esté en el lobby. Al pasar al
    // countdown (started=true) o al desmontar, se detiene. El play puede fallar
    // si el host aterriza aquí sin gesto previo (F5): lo ignoramos.
    // Usamos un ref para poder sincronizar `muted` desde otro efecto cuando el
    // host conmuta el botón de sonido sin recrear el Audio (eso reiniciaría la
    // pista y reproduciría el catch silencioso del autoplay)
    const lobbyAudioRef = useRef(null);
    useEffect(() => {
        if (started) return;
        const audio = new Audio(lobbyMusicUrl);
        audio.loop = true;
        audio.volume = 0.3;
        audio.muted = !soundActive;
        lobbyAudioRef.current = audio;
        audio.play().catch(() => {});
        return () => {
            audio.pause();
            audio.src = '';
            lobbyAudioRef.current = null;
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [started]);

    useEffect(() => {
        if (lobbyAudioRef.current) {
            lobbyAudioRef.current.muted = !soundActive;
        }
    }, [soundActive]);

    // Si llega suficiente gente al lobby, escondemos el aviso forzado por
    // click; el hover/focus seguirá sin disparar el tooltip porque el botón
    // ya no estará bloqueado
    useEffect(() => {
        if (players.length >= MIN_PLAYERS_TO_START && minPlayersTooltipClicked) {
            setMinPlayersTooltipClicked(false);
            if (minPlayersTooltipTimeoutRef.current) {
                clearTimeout(minPlayersTooltipTimeoutRef.current);
                minPlayersTooltipTimeoutRef.current = null;
            }
        }
    }, [players.length, minPlayersTooltipClicked]);

    useEffect(() => () => {
        if (minPlayersTooltipTimeoutRef.current) {
            clearTimeout(minPlayersTooltipTimeoutRef.current);
        }
    }, []);

    const customBg = useMatchBackground();
    const showCustomBg = !!customBg?.src;
    const countdownBackground = showCustomBg ? customBg.src : null;

    if (started && finished) {
        return null;
    }

    const bgImage = showCustomBg ? customBg.src : defaultBgImage;

    return (
        <AnimatePresence mode="wait">
            {started && !finished ? (
                <motion.div
                    key="countdown"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                >
                    <Countdown backgroundImage={countdownBackground} onFinish={handleCountdownFinish} />
                </motion.div>
            ) : (
                <motion.div
                    key="lobby"
                    className={styles.lobbyHost}
                    variants={variants.container}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                >
                    <img className={styles.lobbyHostBackground} src={bgImage} alt="" />

                    <motion.div variants={variants.item}>
                        <HostHeader className={styles.lobbyHostHeader} />
                    </motion.div>

                    <main className={styles.lobbyHostMain}>
                        <motion.div variants={variants.item}>
                            <GamePin />
                        </motion.div>

                        <div className={styles.lobbyHostWaitingContainer}>
                            <motion.h2 variants={variants.item} className={styles.lobbyHostWaiting}>
                                {t('common.multiplayer.lobby.waitingPlayers')}
                                <span className={styles.lobbyPlayerWaitingDots} aria-hidden="true">
                                    <span />
                                    <span />
                                    <span />
                                </span>
                            </motion.h2>

                            {players.length > 0 && (
                                <motion.div variants={variants.item} className={styles.lobbyHostWaitingRoom}>
                                    <WaitingRoom isHost={true} onKickPlayer={requestKick} />
                                </motion.div>
                            )}
                        </div>
                    </main>

                    <motion.footer variants={variants.item} className={styles.lobbyFooter}>
                        <button
                            type="button"
                            className={clsx(styles.lobbyFooterIconButton, locked && styles.lobbyFooterIconButtonActive)}
                            onClick={handleToggleLock}
                            aria-label={locked ? t('common.multiplayer.lobby.unlock') : t('common.multiplayer.lobby.lock')}
                            title={locked ? t('common.multiplayer.lobby.unlock') : t('common.multiplayer.lobby.lock')}
                        >
                            <IconLock locked={locked} />
                        </button>

                        <div className={styles.lobbyStartGroup}>
                            <button
                                type="button"
                                className={clsx(
                                    styles.lobbyFooterStart,
                                    players.length < MIN_PLAYERS_TO_START && styles.lobbyFooterStartLocked,
                                )}
                                onClick={handleStart}
                                disabled={starting}
                                aria-disabled={players.length < MIN_PLAYERS_TO_START}
                            >
                                <FilledPlay />
                                <span>{t('common.multiplayer.lobby.start')}</span>
                            </button>

                            {players.length < MIN_PLAYERS_TO_START && (
                                <div
                                    role="tooltip"
                                    className={clsx(
                                        styles.lobbyMinPlayersTooltip,
                                        minPlayersTooltipClicked && styles.lobbyMinPlayersTooltipVisible,
                                    )}
                                >
                                    {t('common.multiplayer.lobby.minPlayers')}
                                </div>
                            )}
                        </div>

                    </motion.footer>

                    <HostToolbarControls showOptions onOpenOptions={handleOpenSettings} />

                    <LobbySettings open={settingsOpen} onClose={() => setSettingsOpen(false)} />

                    <KickPlayerDialog
                        open={!!kickTarget}
                        nickname={kickTarget?.nickname}
                        onCancel={cancelKick}
                        onConfirm={confirmKick}
                    />
                </motion.div>
            )}
        </AnimatePresence>
    );
}
