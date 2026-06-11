import classes from './AudioComponent.module.scss'
import PropTypes from 'prop-types'
import clsx from 'clsx';
import { useEffect, useRef, useState } from 'react';
import { useGameSounds } from '@educaplay/core'
import { useSelector } from 'react-redux';
import { SCREENS } from '@educaplay/store/constants';

/**
 * @param {string} className - classes that you want to put on the button.
 * @param {string} source - URL for the audio
 * @param {boolean} autoplay - will the component has autoplay property
 * @param {string} color - HEX for the color of the svg elements
 */

const iOS = typeof navigator !== "undefined" && /iPad|iPhone|iPod/.test(navigator.platform);
export function AudioComponent(props) {
    const { source, autoplay = false, className, color = "currentColor", big, insideButton, velocity = 1, allowPause = true, onEnded } = props;
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const audioRef = useRef(null);
    const gameSounds = useGameSounds();
    const view = useSelector(state => state.game.view);

    useEffect(() => {
        if (autoplay) {
            playAudio();
        } else {
            pauseAudio();
        }
    }, [autoplay]);

    useEffect(() => {
        if (view === SCREENS.SCORE_SCREEN) pauseAudio();
    }, [view])

    useEffect(() => {
        audioRef.current.playbackRate = velocity;
    }, [velocity]);

    const playAudio = () => {
        try {
            const playPromise = audioRef.current.play();

            if (playPromise instanceof Promise) {
                playPromise
                    .then(() => setIsPlaying(true))
                    .catch((error) => console.error('Error playing audio', error));
            } else {
                setIsPlaying(true);
            }
        } catch (error) {
            console.error('Error playing audio', error);
        }
    }

    const pauseAudio = () => {
        audioRef.current.pause();
        setIsPlaying(false);
    }

    const handleClick = (e) => {
        e.preventDefault();
        isPlaying ? pauseAudio() : playAudio();
        e.stopPropagation();
    }

    const handleEnded = () => {
        pauseAudio();
        onEnded?.();
    }

    const handleTimeUpdate = () => {

        const currentProgress = audioRef.current.currentTime / audioRef.current.duration * 100;
        setProgress(currentProgress);
    }

    useEffect(() => {
        audioRef.current.volume = gameSounds.specificSoundActive ? 1 : 0;
    }, [gameSounds.specificSoundActive]);

    return (
        <div className={clsx(className, { [classes.component]: true, [classes["component--big"]]: big, [classes.topRight]: insideButton })}>
            <button className={clsx({ [classes.button]: true, [classes["button--iOS"]]: iOS })} onClick={handleClick} disabled={!allowPause}>

                {isPlaying ?
                    <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path className={classes.pause} fillRule="evenodd" clipRule="evenodd" d="M1 0C0.447715 0 0 0.447716 0 1V35C0 35.5523 0.447715 36 0.999999 36H13.4004C13.9526 36 14.4004 35.5523 14.4004 35V1C14.4004 0.447715 13.9526 0 13.4004 0H1ZM22.5997 0C22.0474 0 21.5997 0.447716 21.5997 1V35C21.5997 35.5523 22.0474 36 22.5997 36H35C35.5523 36 36 35.5523 36 35V1C36 0.447715 35.5523 0 35 0H22.5997Z" fill={color} />
                    </svg>
                    : <svg viewBox="0 0 26 27" fill="none">
                        <path className={classes.play} fillRule="evenodd" clipRule="evenodd" d="M3.44653 0.0204163C2.7395 0.0204163 2.052 0.567291 2.052 1.50089V25.0009C2.052 25.8293 2.72357 26.2698 3.552 26.2698C3.83357 26.2698 4.17512 26.0643 4.17512 26.0643C4.17512 26.0643 12.1531 21.4552 12.9984 20.9694V20.9696L14.552 20.0751L23.552 14.8798C23.6331 14.8326 23.7119 14.7874 23.7883 14.7436C24.6165 14.2684 25.1536 13.9603 25.1536 13.1806V13.1415C25.1536 12.3172 24.5847 11.9951 23.7339 11.5132C23.6709 11.4775 23.6063 11.441 23.5403 11.4032L14.5403 6.20792C14.3049 6.07236 14.0875 5.94692 13.893 5.83465C13.5142 5.61609 13.222 5.44746 13.052 5.35135V5.34854C12.4114 4.96964 5.052 0.650885 4.052 0.150885C4.052 0.150885 3.75513 0.0204163 3.44653 0.0204163Z" fill={color}></path>
                    </svg>}

            </button>
            <audio ref={audioRef} className={classes.audio} src={source} autoPlay={autoplay} onEnded={handleEnded} onTimeUpdate={handleTimeUpdate} type="audio/mpeg" ></audio>
            <svg className={clsx(classes.progress, !allowPause && classes.progressdisabled)} viewBox="0 0 212 212">
                <g stroke="currentColor" fill="none">
                    <circle r="96" cy="106" cx="106" strokeWidth="3" stroke={color}></circle>
                    <circle className={classes.circle} strokeDashoffset={2 * Math.PI * 96 * (1 - progress / 100)} r="96" cy="106" cx="106" strokeWidth="12" stroke={color}></circle>
                </g>
            </svg>
        </div>
    )
}

AudioComponent.propTypes = {
    source: PropTypes.oneOfType([PropTypes.string, PropTypes.array]),
    className: PropTypes.string,
    autoplay: PropTypes.bool,
    color: PropTypes.string,
    big: PropTypes.bool,
    insideButton: PropTypes.bool,
    onEnded: PropTypes.func,
}