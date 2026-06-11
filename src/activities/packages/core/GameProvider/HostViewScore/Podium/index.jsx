import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Confetti from "react-confetti";
import clsx from "clsx";
import { AnimatingNumber } from "../../AnimatingNumber";
import { Switch } from "../../Switch";
import { useGameSounds, useTranslate } from "../../../hooks";
import { ScorePanelHeader } from "../ScorePanelHeader";
import styles from "./Podium.module.scss";
import { assetsUrl, getInitials, getAvatarColor, resolveAvatarSrc } from "../../../utils";
import { PointsIcon } from "./icons/PointsIcon";
import { LaurelSvg } from "./icons/LaurelSvg";
import { Platform1Svg } from "./icons/Platform1Svg";
import { Platform2Svg } from "./icons/Platform2Svg";
import { Platform3Svg } from "./icons/Platform3Svg";
import { usePodiumTimeline } from "./usePodiumTimeline";

const lightImg = assetsUrl("common/light.png");
const rankingMusicUrl = assetsUrl("common/rankingmusic.mp3");
const defaultBgImage = assetsUrl("common/background.png");

const MOCK_RANKING = [
    { playerId: "p1", position: 1, avatar: null, nickname: "María", points: 92275, arcadePoints: 92275, realPoints: 88, correctCount: 9, playedCount: 10 },
    { playerId: "p2", position: 2, avatar: null, nickname: "Lorem Ipsum dolor sit amet", points: 90114, arcadePoints: 90114, realPoints: 82, correctCount: 8, playedCount: 10 },
    { playerId: "p3", position: 3, avatar: null, nickname: "Pedro", points: 87475, arcadePoints: 87475, realPoints: 75, correctCount: 7, playedCount: 10 },
    { playerId: "p4", position: 4, avatar: null, nickname: "Ana", points: 81230, arcadePoints: 81230, realPoints: 70, correctCount: 7, playedCount: 10 },
    { playerId: "p5", position: 5, avatar: null, nickname: "Juan Carlos de la Vega", points: 76410, arcadePoints: 76410, realPoints: 66, correctCount: 6, playedCount: 10 },
    { playerId: "p6", position: 6, avatar: null, nickname: "Luis", points: 70015, arcadePoints: 70015, realPoints: 60, correctCount: 6, playedCount: 10 },
    { playerId: "p7", position: 7, avatar: null, nickname: "Carmen", points: 65880, arcadePoints: 65880, realPoints: 55, correctCount: 5, playedCount: 10 },
    { playerId: "p8", position: 8, avatar: null, nickname: "Sofía", points: 58220, arcadePoints: 58220, realPoints: 50, correctCount: 5, playedCount: 10 },
    { playerId: "p9", position: 9, avatar: null, nickname: "Diego", points: 51340, arcadePoints: 51340, realPoints: 45, correctCount: 4, playedCount: 10 },
    { playerId: "p10", position: 10, avatar: null, nickname: "Marta", points: 42105, arcadePoints: 42105, realPoints: 38, correctCount: 3, playedCount: 10 },
];

const MOCK_TITLE = "La vaca lola";

function PlayerColumn({ player, position, revealed, onCountComplete, playerCount, skipIntro }) {
    const isFirst = position === 1;
    const scoreClass = styles[`score${position}`];
    const avatarSrc = resolveAvatarSrc(player.avatar, player.photo);

    const PlatformComponent = position === 1 ? Platform1Svg : position === 2 ? Platform2Svg : Platform3Svg;
    const platformSvgClass = clsx(styles.platformSvg, styles[`platform${position}Svg`]);

    // Clases de ancho adaptativas según cuántos jugadores hay
    const widthClass = playerCount === 1
        ? styles.playerSolo
        : playerCount === 2
            ? (position === 1 ? styles.playerDuoFirst : styles.playerDuoSecond)
            : styles[`player${position}`];

    // arcadePoints es el destacado del podio (el "score de partida" que se
    // anima con conteo); en el bloque secundario mostramos el porcentaje
    // de aciertos sobre las preguntas jugadas
    const arcadeValue = player.arcadePoints ?? player.points ?? 0;
    const correctCount = player.correctCount ?? 0;
    const playedCount = player.playedCount ?? 0;
    const accuracyPercent = playedCount > 0 ? Math.round((correctCount / playedCount) * 100) : 0;

    return (
        <div className={clsx(styles.player, widthClass)} data-animate={`player-${position}`}>
            <div className={styles.playerInfo}>
                <div className={styles.avatarWrapper} data-animate={`avatar-${position}`}>
                    {isFirst && <LaurelSvg className={styles.laurel} data-animate="laurel" />}
                    {avatarSrc ? (
                        <img className={styles.avatar} src={avatarSrc} alt="" />
                    ) : (
                        <div
                            className={styles.avatarPlaceholder}
                            style={{ backgroundColor: getAvatarColor(player.nickname) }}
                        >
                            {getInitials(player.nickname)}
                        </div>
                    )}
                </div>

                <div className={styles.name} data-animate={`name-${position}`}>
                    {player.nickname}
                </div>

                <div className={styles.scoreGroup} data-animate={`score-${position}`}>
                    <div className={clsx(styles.score, scoreClass)}>
                        <PointsIcon className={styles.scoreIcon} />
                        {skipIntro ? (
                            <span className={styles.scoreValue}>{arcadeValue.toLocaleString("es-ES", { maximumFractionDigits: 0 })}</span>
                        ) : revealed ? (
                            <AnimatingNumber
                                value={arcadeValue}
                                decimals={0}
                                slow={isFirst}
                                className={styles.scoreValue}
                                onAnimationComplete={() => onCountComplete && onCountComplete(position)}
                            />
                        ) : (
                            <span className={styles.scoreValue}>0</span>
                        )}
                    </div>
                    <div className={clsx(styles.realScore, styles[`realScore${position}`])}>
                        <span className={styles.realScoreLabel}>%</span>
                        <span className={styles.realScoreValue}>{accuracyPercent}</span>
                    </div>
                </div>
            </div>

            <div className={clsx(styles.platform, styles[`platform${position}`])} data-animate={`platform-${position}`}>
                <PlatformComponent className={platformSvgClass} />
                <span className={clsx(styles.rank, styles[`rank${position}`])} data-animate={`rank-${position}`}>
                    {position}
                </span>
            </div>
        </div>
    );
}

function RankingRow({ player }) {
    const avatarSrc = resolveAvatarSrc(player.avatar, player.photo);
    const arcadeValue = player.arcadePoints ?? player.points ?? 0;
    const correctCount = player.correctCount ?? 0;
    const playedCount = player.playedCount ?? 0;
    const accuracyPercent = playedCount > 0 ? Math.round((correctCount / playedCount) * 100) : 0;

    return (
        <div className={styles.rankingRow}>
            <div className={styles.rankingPosition}>{player.position}</div>
            <div className={styles.rankingAvatarWrapper}>
                {avatarSrc ? (
                    <img className={styles.rankingAvatar} src={avatarSrc} alt="" />
                ) : (
                    <div
                        className={styles.rankingAvatarPlaceholder}
                        style={{ backgroundColor: getAvatarColor(player.nickname) }}
                    >
                        {getInitials(player.nickname)}
                    </div>
                )}
            </div>
            <div className={styles.rankingNickname}>{player.nickname}</div>
            <div className={styles.rankingPoints}>
                <div className={styles.rankingArcade}>
                    <PointsIcon className={styles.rankingPointsIcon} />
                    <span className={styles.rankingArcadeValue}>
                        {arcadeValue.toLocaleString("es-ES", { maximumFractionDigits: 0 })}
                    </span>
                </div>
                <div className={styles.rankingAccuracy}>
                    <span className={styles.rankingAccuracyLabel}>%</span>
                    <span className={styles.rankingAccuracyValue}>{accuracyPercent}</span>
                </div>
            </div>
        </div>
    );
}

export function Podium({ ranking = MOCK_RANKING, title = MOCK_TITLE, backgroundImage, onPositionRevealed, onAnimationComplete, skipIntro = false, expanded = false }) {
    const { soundActive } = useGameSounds();
    const t = useTranslate();
    const bgImage = backgroundImage || defaultBgImage;
    const playerCount = Math.min(ranking.length, 3);
    const onPositionRevealedRef = useRef(onPositionRevealed);
    onPositionRevealedRef.current = onPositionRevealed;
    const onAnimationCompleteRef = useRef(onAnimationComplete);
    onAnimationCompleteRef.current = onAnimationComplete;
    const { scope, play, revealedPlayers, announcingWinner, onCountComplete } = usePodiumTimeline(playerCount, onPositionRevealedRef, onAnimationCompleteRef, skipIntro);
    const podiumAudioRef = useRef(null);
    const [confettiSize, setConfettiSize] = useState({ width: 0, height: 0 });
    const [showFullRanking, setShowFullRanking] = useState(false);

    // El control del ranking completo solo aparece cuando el podio ya está en
    // su layout normal (animación terminada y sidebar visible). Mientras el
    // panel del podio cubre el viewport completo (expanded === true) seguimos
    // mostrando solo el top 3 sin distracciones
    const showRankingControl = !expanded;

    const playerByPosition = {};
    ranking.slice(0, 3).forEach((p) => {
        playerByPosition[p.position] = p;
    });

    useEffect(() => {
        play().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Medimos el contenedor del podio (no la ventana) para que la confeti
    // llene exactamente el panel donde vivimos
    useEffect(() => {
        const node = scope.current;
        if (!node) return;
        const updateSize = () => {
            setConfettiSize({ width: node.clientWidth, height: node.clientHeight });
        };
        updateSize();
        const observer = new ResizeObserver(updateSize);
        observer.observe(node);
        return () => observer.disconnect();
    }, [scope]);

    // Música de fondo en bucle mientras el podio esté montado. Si el navegador
    // bloquea el autoplay (sin gesto previo) ignoramos el rechazo.
    // Mantenemos el Audio en un ref para poder silenciarlo/reactivarlo desde el
    // botón de mute sin recrearlo (no reiniciamos la pista en cada toggle)
    useEffect(() => {
        const audio = new Audio(rankingMusicUrl);
        audio.loop = true;
        audio.volume = 0.3;
        audio.muted = !soundActive;
        podiumAudioRef.current = audio;
        audio.play().catch(() => {});
        return () => {
            audio.pause();
            audio.src = '';
            podiumAudioRef.current = null;
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (podiumAudioRef.current) {
            podiumAudioRef.current.muted = !soundActive;
        }
    }, [soundActive]);

    return (
        <div className={clsx(styles.container, expanded && styles.containerExpanded)} ref={scope}>

            <img
                className={styles.background}
                src={bgImage}
                alt=""
            />

            <img className={styles.light} src={lightImg} alt="" data-animate="light" />

            {announcingWinner && confettiSize.width > 0 && (
                <Confetti gravity={0.02} width={confettiSize.width} height={confettiSize.height} />
            )}

            <ScorePanelHeader title={title} animated />

            <div className={styles.stage}>
                <motion.div
                    className={clsx(styles.podium, playerCount === 1 && styles.podiumSingle, playerCount === 2 && styles.podiumDuo)}
                    initial={false}
                    animate={showFullRanking ? { y: "100%", opacity: 0 } : { y: "0%", opacity: 1 }}
                    transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                >
                    {playerByPosition[2] && (
                        <PlayerColumn
                            player={playerByPosition[2]}
                            position={2}
                            revealed={revealedPlayers.has(2)}
                            onCountComplete={onCountComplete}
                            playerCount={playerCount}
                            skipIntro={skipIntro}
                        />
                    )}
                    {playerByPosition[1] && (
                        <PlayerColumn
                            player={playerByPosition[1]}
                            position={1}
                            revealed={revealedPlayers.has(1)}
                            onCountComplete={onCountComplete}
                            playerCount={playerCount}
                            skipIntro={skipIntro}
                        />
                    )}
                    {playerByPosition[3] && (
                        <PlayerColumn
                            player={playerByPosition[3]}
                            position={3}
                            revealed={revealedPlayers.has(3)}
                            onCountComplete={onCountComplete}
                            playerCount={playerCount}
                            skipIntro={skipIntro}
                        />
                    )}
                </motion.div>

                <AnimatePresence>
                    {showRankingControl && showFullRanking && (
                        <motion.div
                            className={styles.fullRanking}
                            initial={{ y: "100%", opacity: 0 }}
                            animate={{ y: "0%", opacity: 1 }}
                            exit={{ y: "100%", opacity: 0 }}
                            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                        >
                            {ranking.map((player) => (
                                <RankingRow key={player.playerId} player={player} />
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {showRankingControl && (
                <div className={styles.fullRankingBar}>
                    <span className={styles.fullRankingLabel}>{t('common.multiplayer.podium.fullRanking')}</span>
                    <Switch
                        actived={showFullRanking}
                        onChange={() => setShowFullRanking((v) => !v)}
                    />
                </div>
            )}

        </div>
    );
}
