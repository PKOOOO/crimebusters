import { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import Confetti from "react-confetti";
import { MatchFeedbackForm } from "./MatchFeedbackForm";
import { LaurelSvg } from "../HostViewScore/Podium/icons/LaurelSvg";
import { PointsIcon } from "../HostViewScore/Podium/icons/PointsIcon";
import { Cup } from "@educaplay/core/Icons/Cup";
import { Exit } from "@educaplay/core/Icons/Exit";
import { EmojiPicker } from "../EmojiReactions/EmojiPicker";
import { MultiplayerExitDialog } from "../MultiplayerExitDialog";
import { useTranslate, useMatchBackground } from "../../hooks";
import { assetsUrl, getInitials, getAvatarColor, resolveAvatarSrc } from "../../utils";
import styles from "./PlayerPostGame.module.scss";

const THANKS_BANNER_DURATION = 4000;

function formatPoints(points) {
    if (typeof points !== "number") return String(points ?? "");
    return points.toLocaleString("es-ES", { maximumFractionDigits: 0 });
}

function ConfettiBackground({ windowSize }) {
    return (
        <Confetti
            gravity={0.02}
            width={windowSize.width}
            height={windowSize.height}
            className={styles.confetti}
        />
    );
}

function ThanksBanner() {
    const t = useTranslate();
    return (
        <div className={styles.thanksBanner}>
            {t('common.multiplayer.playerPostGame.feedbackThanks')}
        </div>
    );
}

export function PlayerPostGame() {
    const t = useTranslate();
    const ranking = useSelector(state => state.multiplayer.ranking);
    const playerData = useSelector(state => state.multiplayer.playerData);
    const maxRevealedPosition = useSelector(state => state.multiplayer.maxRevealedPosition);
    const feedbackSubmitted = useSelector(state => state.multiplayer.feedback.submitted);
    const feedbackVisible = useSelector(state => state.multiplayer.feedback.visible);
    const user = useSelector(state => state.game.user);
    const customBg = useMatchBackground();
    const backgroundImage = customBg?.src || assetsUrl("common/background.png");
    const currentPlayerId = playerData?.id ? String(playerData.id) : null;

    const currentPlayer = ranking?.find(p => currentPlayerId && String(p.playerId) === currentPlayerId);
    const playerPosition = currentPlayer?.position ?? null;

    // Los puestos del 4 en adelante se revelan al jugador cuando el host
    // ya ha mostrado el top 3 completo en su pantalla (el host revela
    // 3 → 2 → 1, por lo que maxRevealedPosition === 1 marca el final del podio)
    const top3Revealed = maxRevealedPosition === 1;
    const isRevealed = playerPosition !== null && (
        playerPosition > 3
            ? top3Revealed
            : (maxRevealedPosition !== null && playerPosition >= maxRevealedPosition)
    );

    const [windowSize, setWindowSize] = useState({
        width: typeof window !== "undefined" ? window.innerWidth : 0,
        height: typeof window !== "undefined" ? window.innerHeight : 0,
    });

    // Confirmación de salida del jugador desde el podio: el botón de salir
    // abre el modal y solo al aceptar redirigimos al home. Cancelar lo cierra
    // sin más
    const [exitConfirmOpen, setExitConfirmOpen] = useState(false);

    useEffect(() => {
        const handleResize = () => {
            setWindowSize({ width: window.innerWidth, height: window.innerHeight });
        };
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    // Detectamos la transición de no-votado → votado para mostrar el banner una
    // sola vez. Si el jugador recarga después de haber votado, submitted ya
    // viene true desde la rehidratación y no debemos mostrar el agradecimiento
    const [showThanksBanner, setShowThanksBanner] = useState(false);
    const prevSubmittedRef = useRef(feedbackSubmitted);
    useEffect(() => {
        if (!prevSubmittedRef.current && feedbackSubmitted) {
            setShowThanksBanner(true);
            const timer = setTimeout(() => setShowThanksBanner(false), THANKS_BANNER_DURATION);
            prevSubmittedRef.current = feedbackSubmitted;
            return () => clearTimeout(timer);
        }
        prevSubmittedRef.current = feedbackSubmitted;
    }, [feedbackSubmitted]);

    // Cuando el host activa "Valoraciones" y el jugador todavía no ha votado,
    // sustituimos la tarjeta de posición por el formulario. Una vez vota,
    // volvemos a la pantalla de posición con un banner animado de gracias
    if (feedbackVisible && !feedbackSubmitted) {
        return (
            <div className={styles.container}>
                <img className={styles.background} src={backgroundImage} alt="" />
                <ConfettiBackground windowSize={windowSize} />
                <div className={styles.feedbackPanel}>
                    <div className={styles.feedbackTitle}>{t('common.multiplayer.playerPostGame.feedbackTitle')}</div>
                    <MatchFeedbackForm />
                </div>
                <div className={styles.emojiPicker}>
                    <EmojiPicker buttonClassName={styles.emojiButton} />
                </div>
            </div>
        );
    }

    if (!ranking || ranking.length === 0) {
        return (
            <div className={styles.container}>
                <img className={styles.background} src={backgroundImage} alt="" />
                <div className={styles.waiting}>{t('common.multiplayer.playerPostGame.waiting')}</div>
                <div className={styles.emojiPicker}>
                    <EmojiPicker buttonClassName={styles.emojiButton} />
                </div>
            </div>
        );
    }

    if (!isRevealed) {
        return (
            <div className={styles.container}>
                <img className={styles.background} src={backgroundImage} alt="" />
                <div className={styles.suspense}>
                    <div className={styles.suspenseTrophy}>
                        <LaurelSvg className={styles.suspenseLaurel} />
                        <Cup className={styles.suspenseIcon} color="#F2CA0D" size={96} />
                    </div>
                    <div className={styles.suspenseText}>{t('common.multiplayer.playerPostGame.suspense')}</div>
                    <div className={styles.suspenseHint}>{t('common.multiplayer.playerPostGame.suspenseHint')}</div>
                </div>
                <div className={styles.emojiPicker}>
                    <EmojiPicker buttonClassName={styles.emojiButton} />
                </div>
            </div>
        );
    }

    const avatarSrc = resolveAvatarSrc(playerData?.avatar, user?.image);
    const nickname = playerData?.nickname || user?.name || "";
    const initials = getInitials(nickname);
    const avatarColor = getAvatarColor(nickname);

    // Salida del jugador desde el ranking final: para el player no cerramos la
    // partida (eso lo hace el host o el cron); simplemente redirigimos al home
    // de Educaplay
    const requestExit = () => setExitConfirmOpen(true);
    const cancelExit = () => setExitConfirmOpen(false);
    const confirmExit = () => {
        setExitConfirmOpen(false);
        window.location.href = window.__EDUCAPLAY_MAIN_URL;
    };

    const exitLabel = t('common.multiplayer.podium.exit');

    return (
        <div className={styles.container}>
            <img className={styles.background} src={backgroundImage} alt="" />
            <ConfettiBackground windowSize={windowSize} />

            {showThanksBanner && <ThanksBanner />}

            <div className={styles.card}>
                <div className={styles.avatarWrapper}>
                    <LaurelSvg className={styles.laurel} />
                    {avatarSrc ? (
                        <img className={styles.avatar} src={avatarSrc} alt={nickname} />
                    ) : (
                        <div className={styles.avatarPlaceholder} style={{ backgroundColor: avatarColor }}>{initials}</div>
                    )}
                </div>
                <div className={styles.position}>{playerPosition}.</div>
                <div className={styles.message}>{t('common.multiplayer.playerPostGame.congrats')}</div>
                <div className={styles.points}>
                    <PointsIcon className={styles.pointsIcon} />
                    <span className={styles.pointsValue}>{formatPoints(currentPlayer.points)}</span>
                </div>
            </div>

            <div className={styles.emojiPicker}>
                <EmojiPicker buttonClassName={styles.emojiButton} />
                <button
                    type="button"
                    className={styles.exitButton}
                    onClick={requestExit}
                    aria-label={exitLabel}
                    title={exitLabel}
                >
                    <Exit className={styles.exitIcon} />
                </button>
            </div>

            <MultiplayerExitDialog
                open={exitConfirmOpen}
                onCancel={cancelExit}
                onConfirm={confirmExit}
            />
        </div>
    );
}
