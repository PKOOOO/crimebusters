import classes from './CountdownTimerGlobal.module.scss'
import { useEffect, useRef, useState } from 'react';
import { NAME_SOUND_COUNTDOWN, NAME_SOUND_FINAL_COUNTDOWN } from '@educaplay/core'
import PropTypes from 'prop-types';
import { Timer } from '../Timer';
import { useGameSounds } from '@educaplay/core/hooks';
import { useSelector } from 'react-redux';
import { useDispatch } from 'react-redux';
import { decreaseGlobalCountdown } from '@educaplay/store/slices/gameSlice';
import { SCREENS } from '@educaplay/store/constants';
import clsx from 'clsx';

/**
 * @param {number} globalCountdown - time with which the countdown will begin.
 * @param {function} onFinish - function that will be executed once the time expires.
 * @returns {React.ReactNode} - return Countdown Timer. 
 */
export function CountdownTimerGlobal(props) {
    const { onFinish, freezed = false, silenced = false } = props;
    const [lenghtCircle, setLenghtCircle] = useState(0);
    const [countdownLimit, setCountdownLimit] = useState(false);
    const progressRef = useRef(null);
    const gameSounds = useGameSounds();
    const dispatch = useDispatch();
    const screen = useSelector(state => state.game.view);
    const globalCountdown = useSelector(state => state.game.globalCountdown);
    const initialGlobalCountdown = useSelector(state => state.game.initialGlobalCountdown)

    const timeLimit = globalCountdown <= 10 ? 3 : globalCountdown <= 30 ? 5 : globalCountdown <= 60 ? 10 : globalCountdown <= 180 ? 20 : 30;

    useEffect(() => {
        setLenghtCircle(2 * Math.PI * progressRef.current.getAttribute("r"));
    }, [])

    useEffect(() => {
        if (globalCountdown > timeLimit) {
            setCountdownLimit(false);
        } else {
            setCountdownLimit(true);
            if (screen !== SCREENS.SCORE_SCREEN && globalCountdown !== 0 && !silenced) globalCountdown !== 0 ? gameSounds.play(NAME_SOUND_COUNTDOWN) : gameSounds.play(NAME_SOUND_FINAL_COUNTDOWN);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [globalCountdown, timeLimit])


    useEffect(() => {
        if (freezed) return;

        if (globalCountdown === 0) {
            onFinish()
            return;
        }

        const interval = setInterval(() => {
            dispatch(decreaseGlobalCountdown());
        }, 1000);
        return () => clearInterval(interval);

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [freezed, dispatch, globalCountdown]);

    const formatTime = (seconds) => {
        if (seconds > 60) {
            const minutes = Math.floor(seconds / 60);
            const remainingSeconds = seconds % 60;

            const formattedMinutes = String(minutes).padStart(2, '0');
            const formattedSeconds = String(remainingSeconds).padStart(2, '0');

            return `${formattedMinutes}:${formattedSeconds}`;
        }
        return seconds;
    }

    return (
        <div className={classes.wrapper}>

            <div className={classes.countdownWrapper}>
                <div className={classes.countdown}>{formatTime(globalCountdown)}</div>
                <div>
                    <svg className={clsx(classes.svgCircle, { [classes.limit]: countdownLimit })} width="44" height="44" viewBox="0 0 44 44" fill="none">
                        <path d="M22 44C34.1503 44 44 34.1502 44 22C44 9.84974 34.1503 0 22 0C9.84974 0 0 9.84974 0 22C0 34.1502 9.84974 44 22 44Z" fill="#FAFFF3" />
                        <path d="M22 6C30.4533 6 38 13.5467 38 22C38 30.4533 30.4533 38 22 38C13.5467 38 6 30.4533 6 22C6 13.5467 13.5467 6 22 6ZM22 0C9.84668 0 0 9.84668 0 22C0 34.1533 9.84668 44 22 44C34.1533 44 44 34.1533 44 22C44 9.84668 34.1533 0 22 0Z" fill="currentColor" />
                        {/* Copia coloreada */}
                        <circle ref={progressRef} cx="22" cy="22" r="19" strokeDashoffset={lenghtCircle * (globalCountdown / initialGlobalCountdown)} strokeDasharray={lenghtCircle} strokeMiterlimit="10" strokeWidth="2px" />
                    </svg>
                </div>
            </div>
            <div className={classes.timerComponent}><Timer freezed={freezed} onlyTimer={false} className={clsx(classes.hasCountdown, { [classes.limit]: countdownLimit })} /></div>

        </div>
    );
}

CountdownTimerGlobal.propTypes = {
    onFinish: PropTypes.func,
    freezed: PropTypes.bool,
}
