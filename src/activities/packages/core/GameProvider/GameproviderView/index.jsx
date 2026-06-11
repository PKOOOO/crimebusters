import { useLayoutEffect, useState, useRef, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { GameProviderMainMenu } from "../GameProviderMainMenu";
import { SCREENS } from "@educaplay/store/constants";
import { setView, startGame } from "@educaplay/store/slices/gameSlice";
import { GameProviderContent } from "../GameProviderContent";
import { GameProviderScore } from "../GameProviderScore";
import { HostViewController } from "../HostViewController";
import { WebSocketProvider } from "../WebSocketProvider";
import { EmojiOverlay } from "../EmojiReactions/EmojiOverlay";
import { QuestionCountdown } from "../QuestionCountdown";
import { LobbyView } from "../Lobby";
import { PlayerPostGame } from "../PlayerPostGame";
import { PlayerKickListener } from "../PlayerKickListener";
import { useMultiplayer, useMatchBackground } from "@educaplay/core/hooks";
import styles from './GameproviderView.module.scss';
import PropTypes from 'prop-types';
import GameproviderViewTutorial from "./GameproviderViewTutorial";
import clsx from "clsx";
import DebugWebSocketProvider from "../DebugWebsocketProvider";
import { ConnectionLostModal } from "../ConnectionLostModal";

export function GameProviderView(props) {
    const { gameImage, gameTutorial, Game, hasCustomLayout, preloadDuringCountdown = false, classes: customClasses } = props

    const [showScoreScreen, setShowScoreScreen] = useState(false);
    const [isCountdownActive, setIsCountdownActive] = useState(false);
    const dispatch = useDispatch();
    const screen = useSelector(state => state.game.view);
    const { isHost, isMultiplayer } = useMultiplayer();
    const finished = useSelector(state => state.multiplayer.finished);
    // Mientras rehidratamos el backlog (F5, reconexión…) los reducers reciben
    // mensajes históricos en cascada y por instantes el estado parece "partida
    // anterior terminada" (finished=true, ranking poblado) antes de que llegue
    // el matchRestarted final. Si dejáramos pintar libremente, el host vería
    // por unos ms el podio de la partida vieja y el player vería el
    // PlayerPostGame de la anterior. Cubrimos TODAS las pantallas multiplayer
    // (no solo el lobby) hasta que useMultiplayerWS marque rehydrating=false.
    const rehydrating = useSelector(state => state.multiplayer.rehydrating);
    const backgroundImage = useMatchBackground();
    const gameContentRef = useRef();
    const mainMenuRef = useRef();
    const [showTutorial, setShowTutorial] = useState(false);
    const hasTutorial = gameTutorial?.image !== undefined;

    // Host auto-skips MAIN_MENU: initialize game and go to GAME screen
    useLayoutEffect(() => {
        if (isHost && screen === SCREENS.MAIN_MENU) {
            dispatch(startGame());
        }
    }, [isHost, screen, dispatch]);

    useLayoutEffect(() => {
        setShowScoreScreen(false);
        if (screen === SCREENS.SCORE_SCREEN && !isMultiplayer) {
            gameContentRef.current.animateExit().then(() => {
                setShowScoreScreen(true);
            })
        }
        if (screen === SCREENS.GAME && hasTutorial && !isHost) {
            setShowTutorial(true);
        }
    }, [screen, hasTutorial, isHost, isMultiplayer])

    const handleStartGame = useCallback(() => {
        dispatch(startGame());
        // Entry animations will run via GameProviderContent's useEffect
        // when screen changes to GAME
        setIsCountdownActive(false);
    }, [dispatch])

    const handleCountdownStart = useCallback(() => {
        if (preloadDuringCountdown) {
            // Small delay so the countdown animation starts smoothly
            // before mounting the heavy game content (Phaser)
            setTimeout(() => {
                setIsCountdownActive(true);
            }, 300);
        }
    }, [preloadDuringCountdown])

    const handleRestartGame = () => {
        setIsCountdownActive(false);
        dispatch(setView(SCREENS.MAIN_MENU));
        setTimeout(() => {
            mainMenuRef.current?.start();
        }, 400)
    }

    // Render game content when countdown is active (preloading) or when past MAIN_MENU
    const showLobby = screen === SCREENS.LOBBY;
    const showHostView = isHost && screen === SCREENS.GAME;
    const playerReachedEnd = !isHost && isMultiplayer && screen === SCREENS.SCORE_SCREEN;
    const showPlayerPostGame = !isHost && isMultiplayer && (finished || playerReachedEnd);
    const showGameContent = !isHost && !showLobby && !showPlayerPostGame && (isCountdownActive || screen !== SCREENS.MAIN_MENU);
    const showMainMenu = !isHost && screen === SCREENS.MAIN_MENU && !showPlayerPostGame;
    const showBackgroundImage = backgroundImage.showGame && backgroundImage.src;

    const content = (
        <>
            {showLobby && <LobbyView />}

            {showPlayerPostGame && <PlayerPostGame />}

            {showHostView && (
                <div key="host-view" className={clsx(styles.gameScreen, customClasses.screen)}>
                    <div className={styles.container}>
                        <HostViewController Game={Game} gameImage={gameImage} classes={customClasses} />
                    </div>
                </div>
            )}

            {showGameContent && (
                <div key="game-content" className={clsx(styles.gameScreen, customClasses.screen)} style={showBackgroundImage ? { backgroundImage: `url(${backgroundImage.src})` } : undefined}>
                    {showBackgroundImage && (<div className={styles.gameScreenShadow} />)}

                    <div className={styles.container}>
                        <GameProviderContent ref={gameContentRef} Game={Game} hasCustomLayout={hasCustomLayout} classes={customClasses} />
                    </div>
                    {isMultiplayer && <QuestionCountdown />}
                    <div id="swipeable-drawer-portal-element"/>
                </div>
            )}

            {showMainMenu && (
                <div key="main-menu" className={isCountdownActive ? styles.mainMenuOverlay : styles.mainMenuWrapper}>
                    <GameProviderMainMenu
                        gameImage={gameImage}
                        ref={mainMenuRef}
                        onStart={handleStartGame}
                        onCountdownStart={handleCountdownStart}
                    />
                </div>
            )}

            {showTutorial && (
                <GameproviderViewTutorial
                    imageSource={gameTutorial.image}
                    onClose={() => setShowTutorial(false)}
                    delay={gameTutorial.delay}
                    duration={gameTutorial.duration}
                />
            )}

            {showScoreScreen && !isMultiplayer && (
                <GameProviderScore onRestart={handleRestartGame} />
            )}

            {isMultiplayer && <EmojiOverlay />}

            {isMultiplayer && !isHost && <PlayerKickListener />}
        </>
    );

    if (isMultiplayer) {
        return (
            <WebSocketProvider>
                <DebugWebSocketProvider>{rehydrating ? null : content}</DebugWebSocketProvider>
                <ConnectionLostModal />
            </WebSocketProvider>
        );
    }

    return content;
}


GameProviderView.propTypes = {
    gameImage: PropTypes.string.isRequired,
    Game: PropTypes.any.isRequired,
    hasCustomLayout: PropTypes.bool,
    preloadDuringCountdown: PropTypes.bool,
    gameTutorial: PropTypes.shape({
        image: PropTypes.string.isRequired,
        duration: PropTypes.number.isRequired
    }),
    classes: PropTypes.object
}
