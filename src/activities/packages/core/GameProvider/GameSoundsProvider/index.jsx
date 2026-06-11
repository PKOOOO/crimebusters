import { GameSoundsContext } from "./GameSoundContext";
import {
  NAME_SOUND_FINAL_COUNTDOWN,
  NAME_SOUND_INTRO,
  NAME_SOUND_ACTIVE_BANK,
  NAME_SOUND_HOVER,
  NAME_SOUND_POINTS,
  NAME_SOUND_FAILURE,
  NAME_SOUND_LIVE,
  NAME_SOUND_COUNTDOWN,
  NAME_SOUND_WIN,
  NAME_SOUND_LOSS,
  NAME_SOUND_POINTS_COUNT,
  NAME_SOUND_SUCCESS,
  NAME_SOUND_WRONG,
  NAME_SOUND_ACTIVE,
  NAME_SOUND_ACTIVATE,
  NAME_SOUND_CHARGE,
  NAME_SOUND_MOVE,
} from "../../utils";
import { assetsUrl } from "../../utils";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";

const SHARED_AUDIOS = {
  [NAME_SOUND_INTRO]: assetsUrl("common/intro.mp3"),
  [NAME_SOUND_ACTIVE_BANK]: assetsUrl("common/enunciado.mp3"),
  [NAME_SOUND_HOVER]: assetsUrl("common/hover.mp3"),
  [NAME_SOUND_POINTS]: assetsUrl("common/puntos.mp3"),
  [NAME_SOUND_FAILURE]: assetsUrl("common/fallo.mp3"),
  [NAME_SOUND_SUCCESS]: assetsUrl("common/bien.mp3"),
  [NAME_SOUND_WRONG]: assetsUrl("common/mal.mp3"),
  [NAME_SOUND_LIVE]: assetsUrl("common/vida.mp3"),
  [NAME_SOUND_COUNTDOWN]: assetsUrl("common/countdown.mp3"),
  [NAME_SOUND_WIN]: assetsUrl("common/ganado.mp3"),
  [NAME_SOUND_LOSS]: assetsUrl("common/perdido.mp3"),
  [NAME_SOUND_POINTS_COUNT]: assetsUrl("common/conteopuntos.mp3"),
  [NAME_SOUND_FINAL_COUNTDOWN]: assetsUrl("common/tiempoatrasfinal.mp3"),
  [NAME_SOUND_ACTIVE]: assetsUrl("common/activo.mp3"),
  [NAME_SOUND_ACTIVATE]: assetsUrl("common/activar.mp3"),
  [NAME_SOUND_CHARGE]: assetsUrl("common/carga.mp3"),
  [NAME_SOUND_MOVE]: assetsUrl("common/mover.mp3"),
};

const audioContext = new (window.AudioContext || window.webkitAudioContext)();
const audioBufferCache = new Map();

export function GameSoundsProvider({ children, sounds = {} }) {
  const [soundActive, setSoundActive] = useState(true);
  const [specificSoundActive, setSpecificSoundActive] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  const audios = useMemo(() => {
    Object.keys(sounds).forEach((key) => {
      if (SHARED_AUDIOS[key]) {
        throw new Error(`Invalid sound name: ${key}`);
      }
    });

    return {
      ...SHARED_AUDIOS,
      ...sounds,
    };
  }, [sounds]);

  useEffect(() => {
    const preloadAudios = async () => {
      setIsLoading(true);

      const preloadPromises = Object.entries(audios).map(
        async ([soundName, src]) => {
          try {
            if (!audioBufferCache.has(soundName)) {
              const response = await fetch(src);
              const arrayBuffer = await response.arrayBuffer();
              const audioBuffer = await audioContext.decodeAudioData(
                arrayBuffer
              );
              audioBufferCache.set(soundName, audioBuffer);
            }
          } catch (error) {
            console.error(`Error preloading audio ${soundName} ${src}:`, error);
          }
        }
      );

      await Promise.all(preloadPromises);
      setIsLoading(false);
    };

    preloadAudios();
  }, [audios]);

  // `play` se mantiene estable entre renders para que los consumidores que lo
  // usen en useEffect/useCallback no vuelvan a ejecutar sus efectos al cambiar
  // soundActive (mute/unmute). Sin esto, alternar el mute re-disparaba sonidos
  // como el intro del host (HostViewController).
  const soundActiveRef = useRef(soundActive);
  useEffect(() => {
    soundActiveRef.current = soundActive;
  }, [soundActive]);

  const play = useCallback(
    (soundName, config = {}) => {
      if (!soundActiveRef.current) return;

      const audioBuffer = audioBufferCache.get(soundName);

      if (!audioBuffer) {
        console.error(`Audio not loaded in cache: ${soundName}`);
        return;
      }

      try {
        const { volume = 1 } = config;

        const source = audioContext.createBufferSource();
        const gainNode = audioContext.createGain();

        source.buffer = audioBuffer;
        gainNode.gain.value = volume;

        source.connect(gainNode);
        gainNode.connect(audioContext.destination);
        source.start(0);
        return source;
      } catch (error) {
        console.error("Error playing audio:", error);
      }
    },
    []
  );

  return (
    <GameSoundsContext.Provider
      value={{
        soundActive,
        setSoundActive,
        play,
        specificSoundActive,
        setSpecificSoundActive,
        isLoading,
      }}
    >
      {children}
    </GameSoundsContext.Provider>
  );
}

GameSoundsProvider.propTypes = {
  children: PropTypes.node,
  sounds: PropTypes.object,
};
