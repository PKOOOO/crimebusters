import { useCallback, useLayoutEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { startGame } from '@educaplay/store/slices/gameSlice';
import { leaveMatch } from '@educaplay/core/services/multiplayer';
import { getInitials, getAvatarColor, resolveAvatarSrc } from '@educaplay/core/utils';
import { useTranslate, useMatchBackground } from '@educaplay/core/hooks';
import { Button } from '@educaplay/core';
import { Dialog } from '@educaplay/core/components';
import { EducaplayLogo } from '../EducaplayLogo';
import { NicknameForm } from './NicknameForm';
import { Countdown } from './Countdown';
import { assetsUrl } from '../../utils';
import styles from './Lobby.module.scss';

const defaultBgImage = assetsUrl('common/background.png');

function redirectToLanding() {
    window.location.href = window.__EDUCAPLAY_MAIN_URL;
}

export function LobbyPlayer() {
    const t = useTranslate();
    const dispatch = useDispatch();
    const match = useSelector(state => state.multiplayer.match);
    const user = useSelector(state => state.game.user);
    const started = useSelector(state => state.multiplayer.started);
    const finished = useSelector(state => state.multiplayer.finished);
    const serverQuestionIndex = useSelector(state => state.multiplayer.question?.index ?? null);
    const customBg = useMatchBackground();
    const countdownBackground = customBg?.src || null;
    const backgroundImage = customBg?.src || defaultBgImage;
    const backgroundStyle = { backgroundImage: `url(${backgroundImage})` };
    const backgroundClassName = `${styles.lobbyPlayer} ${styles.lobbyBackground}`;
    const reconnectPlayerData = useSelector(state => state.multiplayer.playerData);
    const joined = !!reconnectPlayerData;
    const playerData = reconnectPlayerData;
    const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);

    // Submit clásico de form: el backend (controller_matchPlayer::joinSubmit) crea
    // el player y redirige de vuelta al lobby. La página recarga y lobbyScreen +
    // getLobbyData devuelven el playerData ya poblado.
    const handleJoin = useCallback((nickname) => {
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = '/matches/join/';

        const pinInput = document.createElement('input');
        pinInput.type = 'hidden';
        pinInput.name = 'pin';
        pinInput.value = match.pin;
        form.appendChild(pinInput);

        const nicknameInput = document.createElement('input');
        nicknameInput.type = 'hidden';
        nicknameInput.name = 'nickname';
        nicknameInput.value = nickname;
        form.appendChild(nicknameInput);

        document.body.appendChild(form);
        form.submit();
    }, [match]);

    const handleCountdownFinish = useCallback(() => {
        // En reconexión a mitad de partida arrancamos el juego ya posicionado
        // sobre la pregunta abierta en el servidor; en partida nueva, en la 0
        dispatch(startGame({ startIndex: serverQuestionIndex ?? 0 }));
    }, [dispatch, serverQuestionIndex]);

    const handleLeave = useCallback(() => {
        setLeaveDialogOpen(true);
    }, []);

    const handleLeaveCancel = useCallback(() => {
        setLeaveDialogOpen(false);
    }, []);

    const handleLeaveConfirm = useCallback(async () => {
        setLeaveDialogOpen(false);
        if (match?.id) {
            try {
                await leaveMatch();
            } catch (e) {
                // Si el WS ya estaba cerrado, el grace period del backend cubrirá la desconexión
            }
        }
        redirectToLanding();
    }, [match]);

    // Si la partida ya terminó (reconexión con status RESULTS), saltar
    // directamente al juego sin mostrar el countdown
    useLayoutEffect(() => {
        if (started && finished && joined) {
            dispatch(startGame({ startIndex: serverQuestionIndex ?? 0 }));
        }
    }, [started, finished, joined, dispatch, serverQuestionIndex]);

    if (started && finished && joined) {
        return null;
    }

    if (started && joined) {
        return <Countdown backgroundImage={countdownBackground} onFinish={handleCountdownFinish} />;
    }

    // Si el usuario ya está identificado y tiene nombre, auto-join
    if (!joined && user?.name) {
        handleJoin(user.name);
    }

    if (!joined) {
        return (
            <div className={backgroundClassName} style={backgroundStyle}>
                <header className={styles.lobbyHeader}>
                    <div className={styles.lobbyHeaderLogo}>
                        <EducaplayLogo />
                    </div>
                </header>
                <main className={styles.lobbyPlayerMain}>
                    <NicknameForm onSubmit={handleJoin} />
                </main>
            </div>
        );
    }

    return (
        <div className={backgroundClassName} style={backgroundStyle}>
            <header className={styles.lobbyHeader}>
                <div className={styles.lobbyHeaderLogo}>
                    <EducaplayLogo />
                </div>
            </header>
            <main className={styles.lobbyPlayerMain}>
                <div className={styles.lobbyPlayerWaiting}>
                    {(() => {
                        const displayName = playerData?.nickname || user?.name;
                        const avatarSrc = resolveAvatarSrc(playerData?.avatar, user?.image);
                        return (
                            <div className={styles.lobbyPlayerAvatar}>
                                {avatarSrc ? (
                                    <img src={avatarSrc} alt={displayName} />
                                ) : (
                                    <div
                                        className={styles.playerCardAvatarPlaceholder}
                                        style={{ backgroundColor: getAvatarColor(displayName) }}
                                    >
                                        {getInitials(displayName)}
                                    </div>
                                )}
                            </div>
                        );
                    })()}
                    <h3>{playerData?.nickname || user?.name}</h3>
                    <p className={styles.lobbyPlayerMessage}>
                        {t('common.multiplayer.lobby.joinedTitle')}
                        <span className={styles.lobbyPlayerWaitingDots} aria-hidden="true">
                            <span />
                            <span />
                            <span />
                        </span>
                    </p>
                    <button type="button" className={styles.lobbyPlayerLeaveButton} onClick={handleLeave}>
                        {t('common.multiplayer.lobby.leaveButton')}
                    </button>
                </div>
            </main>
            <Dialog open={leaveDialogOpen} onClose={handleLeaveCancel} variant="confirm">
                <div className={styles.kickDialog}>
                    <div className={styles.kickDialogHeader}>
                        <p>{t('common.multiplayer.lobby.leaveConfirm')}</p>
                    </div>
                    <div className={styles.kickDialogFooter}>
                        <Button className={styles.kickDialogCancel} onClick={handleLeaveCancel}>
                            {t('common.settings.cancel')}
                        </Button>
                        <Button className={styles.kickDialogAccept} onClick={handleLeaveConfirm}>
                            {t('common.multiplayer.lobby.leaveConfirmAction')}
                        </Button>
                    </div>
                </div>
            </Dialog>
        </div>
    );
}
