import classes from './CountdownTimerPillGlobal.module.scss'
import { useEffect, useState } from 'react';
import { NAME_SOUND_COUNTDOWN, NAME_SOUND_FINAL_COUNTDOWN } from '@educaplay/core'
import PropTypes from 'prop-types';
import { Timer } from '../Timer';
import { useGameSounds } from '@educaplay/core/hooks';
import { useSelector } from 'react-redux';
import { useDispatch } from 'react-redux';
import { decreaseGlobalCountdown } from '@educaplay/store/slices/gameSlice';
import { SCREENS } from '@educaplay/store/constants';
import { useLayoutEffect } from 'react';

/**
 * @param {number} globalCountdown - time with which the countdown will begin.
 * @param {function} onFinish - function that will be executed once the time expires.
 * @returns {React.ReactNode} - return Countdown Timer. 
 */
export function CountdownTimerPillGlobal(props) {
    const { onFinish, freezed = false, silenced = false } = props;
    const [countdownLimit, setCountdownLimit] = useState(false);
    const gameSounds = useGameSounds();
    const dispatch = useDispatch();
    const screen = useSelector(state => state.game.view);
    const globalCountdown = useSelector(state => state.game.globalCountdown);
    const [svgDimension, setSvgDimension] = useState({
        width: 80,
        height: 36,
        stroke: 4,
        innerStroke: 2
    })

    const timeLimit = globalCountdown <= 10 ? 3 : globalCountdown <= 30 ? 5 : globalCountdown <= 60 ? 10 : globalCountdown <= 180 ? 20 : 30;    

    useEffect(() => {
        if (globalCountdown > timeLimit) {
            setCountdownLimit(false);
        } else {
            setCountdownLimit(true);
            if(screen !== SCREENS.SCORE_SCREEN && globalCountdown !== 0 && !silenced ) globalCountdown !== 0 ? gameSounds.play(NAME_SOUND_COUNTDOWN) : gameSounds.play(NAME_SOUND_FINAL_COUNTDOWN);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [globalCountdown, timeLimit])


    useEffect(() => {
        if (freezed) return;

        if(globalCountdown === 0) {
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
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;

        const formattedMinutes = String(minutes).padStart(2, '0');
        const formattedSeconds = String(remainingSeconds).padStart(2, '0');

        return `${formattedMinutes}:${formattedSeconds}`;
    };

    useLayoutEffect(() => {
        const calculateDimensions = () => {
            const width = window.innerWidth;
            
            if (width < 767) {
                setSvgDimension({
                    width: 80,
                    height: 36,
                    stroke: 4,
                    innerStroke: 2
                })

            } else if (width < 1023) {
                setSvgDimension({
                    width: 100,
                    height: 44,
                    stroke: 4.5,
                    innerStroke: 2
                })

            } else {
                setSvgDimension({
                    width: 115,
                    height: 52,
                    stroke: 5,
                    innerStroke: 4
                })
            }
        }
        window.addEventListener('resize', calculateDimensions);
        calculateDimensions()
        return () => {
            window.removeEventListener("resize", calculateDimensions)
        }
    }, [])

    return (
        <div className={classes.countdownWrapper}>
            <div className={classes.countdown}>{formatTime(globalCountdown)}</div>
            <div>
                <svg className={classes.timerSvg} width={svgDimension.width} height={svgDimension.height} viewBox={`0 0 ${svgDimension.width} ${svgDimension.height}`} fill="none">
                    <rect className={classes.border} x={svgDimension.stroke / 2} y={svgDimension.stroke / 2} width={svgDimension.width - svgDimension.stroke} height={svgDimension.height - svgDimension.stroke} rx={(svgDimension.height - svgDimension.stroke) / 2} fill="white" stroke="currentColor" strokeWidth={svgDimension.stroke} />
                </svg>
            </div>
            <div className={classes.timerComponent}><Timer  freezed={freezed} onlyTimer={false} show={false} className={countdownLimit ? classes.limit : ''} /></div>
        </div>
    );
}

CountdownTimerPillGlobal.propTypes = {
    onFinish: PropTypes.func,
    freezed: PropTypes.bool,
}
