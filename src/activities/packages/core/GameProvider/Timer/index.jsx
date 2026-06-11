import classes from './Timer.module.scss';
import PropTypes from 'prop-types';
import clsx from 'clsx';
import { useSelector } from 'react-redux';

/**
 * @param {string} className - classes that want to put on the clock.
 * @returns {React.ReactNode} - return Timer. 
 */
export function Timer(props) {
    const { className, onlyTimer = true, show = true } = props;

    const time = useSelector(state => state.game.time);

    const formatTime = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;

        const formattedMinutes = String(minutes).padStart(2, '0');
        const formattedSeconds = String(remainingSeconds).padStart(2, '0');

        return `${formattedMinutes}:${formattedSeconds}`;
    }

    if (!show) {
        return null;
    }

    return (
        <div className={clsx(onlyTimer ? classes.onlyTimerWrapper : classes.wrapper, className)}>
            <div className={clsx(classes.timer)}>{formatTime(time)}</div>
        </div>
    );
}

Timer.propTypes = {
    className: PropTypes.string,
    freezed: PropTypes.bool,
    color: PropTypes.string
}

