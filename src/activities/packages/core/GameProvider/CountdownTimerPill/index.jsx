import classes from './CountdownTimerPill.module.scss'
import { useEffect, useLayoutEffect, useState } from 'react';
import { NAME_SOUND_COUNTDOWN, NAME_SOUND_FINAL_COUNTDOWN } from '@educaplay/core'
import PropTypes from 'prop-types';
import { useGameSounds } from "@educaplay/core/hooks";
import { Timer } from '../Timer';
import { useSelector } from 'react-redux';
import { useDispatch } from 'react-redux';
import { decreaseQuestionTime } from '@educaplay/store/slices/gameSlice';
import { SCREENS } from '@educaplay/store/constants';

/**
 * @param {number} startTime - time with which the countdown will begin.
 * @param {function} onFinish - function that will be executed once the time expires.
 * @returns {React.ReactNode} - return Countdown Timer. 
 */
export function CountdownTimerPill(props) {
    const { onFinish, freezed = false, silenced = false } = props;
    const [, setLenghtSvg] = useState(0);
    const [countdownLimit, setCountdownLimit] = useState(false)
    const gameSounds = useGameSounds();
    const dispatch = useDispatch();
    const questionTime = useSelector(state => state.game.questions[state.game.currentIndex].time);
    const startTime = useSelector(state => state.game.initialQuestions[state.game.currentIndex].time)
    const screen = useSelector(state => state.game.view);
    const [svgDimension, setSvgDimension] = useState({
        width: 80,
        height: 36,
        stroke: 4,
        innerStroke: 2
    })

    const timeLimit = startTime <= 10 ? 3 : startTime <= 30 ? 5 : startTime <= 60 ? 10 : startTime <= 180 ? 20 : 30;

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

    useEffect(() => {
        setLenghtSvg((2 * Math.PI * (svgDimension.height - svgDimension.stroke) / 2) + (2 * (svgDimension.width - svgDimension.height)))
    }, [svgDimension])

    useEffect(() => {
        if (questionTime > timeLimit) {
            setCountdownLimit(false)
        } else {
            setCountdownLimit(true)
            if (screen !== SCREENS.SCORE_SCREEN && questionTime !== 0 && !silenced) questionTime !== 0 ? gameSounds.play(NAME_SOUND_COUNTDOWN) : gameSounds.play(NAME_SOUND_FINAL_COUNTDOWN);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [questionTime, timeLimit])


    useEffect(() => {
        if (freezed) return;

        if (questionTime === 0) {
            onFinish()
            return;
        }

        const interval = setInterval(() => {
            dispatch(decreaseQuestionTime());
        }, 1000);
        return () => clearInterval(interval);

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [onFinish, startTime, freezed]);

    const formatTime = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;

        const formattedMinutes = String(minutes).padStart(2, '0');
        const formattedSeconds = String(remainingSeconds).padStart(2, '0');

        return `${formattedMinutes}:${formattedSeconds}`;
    };

    return (

        <div className={classes.countdownWrapper}>
            <div className={classes.countdown}>{formatTime(questionTime)}</div>
            <div>
                <svg className={classes.timerSvg} width={svgDimension.width} height={svgDimension.height} viewBox={`0 0 ${svgDimension.width} ${svgDimension.height}`} fill="none">
                    <rect className={classes.border} x={svgDimension.stroke / 2} y={svgDimension.stroke / 2} width={svgDimension.width - svgDimension.stroke} height={svgDimension.height - svgDimension.stroke} rx={(svgDimension.height - svgDimension.stroke) / 2} fill="white" stroke="currentColor" strokeWidth={svgDimension.stroke} />
                </svg>
            </div>
            <div className={classes.timerComponent}><Timer freezed={freezed} onlyTimer={false} show={false} className={countdownLimit ? classes.limit : ''} /></div>
        </div>

    );
}

CountdownTimerPill.displayName = 'GameCountdown';

CountdownTimerPill.propTypes = {
    startTime: PropTypes.number.isRequired,
    onFinish: PropTypes.func,
    freezed: PropTypes.bool,
}