import { useCallback, useEffect, useRef } from "react";
import { useFullScreen, useTranslate, useGameSounds } from "@educaplay/core/hooks";
import { Sound } from "@educaplay/core/Icons/Sound";
import { SoundOff } from "@educaplay/core/Icons/SoundOff";
import { Options } from "@educaplay/core/Icons/Options";
import { FullScreen } from "@educaplay/core/Icons/FullScreen";
import { FullScreenReduce } from "@educaplay/core/Icons/FullScreenReduce";
import { useEmojiAnchor } from "../EmojiReactions/EmojiAnchorContext";
import styles from "./HostToolbarControls.module.scss";

// Toolbar fijo abajo-derecha con los controles transversales del host
// (sonido / opciones / pantalla completa). Se utiliza en lobby, juego y
// podium. El botón de opciones sólo es relevante en el lobby (settings de
// la partida), por eso es opt-in vía `showOptions` + `onOpenOptions`.
export function HostToolbarControls({ showOptions = false, onOpenOptions }) {
    const t = useTranslate();
    const { soundActive, setSoundActive } = useGameSounds();
    const [fullScreen, setFullScreen] = useFullScreen();

    // Las reacciones con emojis del jugador apuntan al grupo de botones de la
    // derecha del host. Como el toolbar se monta en distintas pantallas, cada
    // instancia registra su propio nodo como anchor mientras está visible.
    const containerRef = useRef(null);
    const { setAnchor } = useEmojiAnchor();
    useEffect(() => {
        setAnchor(containerRef.current);
        return () => setAnchor(null);
    }, [setAnchor]);

    const handleToggleSound = useCallback(() => {
        setSoundActive(prev => !prev);
    }, [setSoundActive]);

    const handleToggleFullScreen = useCallback(() => {
        setFullScreen(!fullScreen);
    }, [fullScreen, setFullScreen]);

    return (
        <div className={styles.toolbar} ref={containerRef}>
            <button
                type="button"
                className={styles.button}
                onClick={handleToggleSound}
                aria-label={t('common.multiplayer.lobby.volume')}
                aria-pressed={!soundActive}
            >
                {soundActive ? <Sound /> : <SoundOff />}
            </button>

            {showOptions && (
                <button
                    type="button"
                    className={styles.button}
                    onClick={onOpenOptions}
                    aria-label={t('common.multiplayer.lobby.settingsAria')}
                >
                    <Options />
                </button>
            )}

            <button
                type="button"
                className={styles.button}
                onClick={handleToggleFullScreen}
                aria-label={t('common.accesibility.fullscreen')}
            >
                {fullScreen ? <FullScreenReduce /> : <FullScreen />}
            </button>
        </div>
    );
}
