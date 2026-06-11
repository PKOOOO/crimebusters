import classes from './Score.module.scss'
import PropTypes from 'prop-types';
import GameWin from '../GameWin';
import GameOver from '../GameOver';
import GameAchieved from '../GameAchieved';
import { useTranslate } from '@educaplay/core/hooks';
import { AnimatingNumber } from '../../AnimatingNumber';

const DELAY = 1000;
const RESULTS = {
    WIN: "win",
    ACHIEVED: "achieved",
    LOST: "lost"
}

const getResult = (lives, points) => {
    
    points = parseInt(points.toFixed(0));

    if(lives === 0) return RESULTS.LOST
    if(points < 50) return RESULTS.LOST
    if(points === 100) return RESULTS.WIN

    return RESULTS.ACHIEVED
}

export function Score({ lives, points, finalText }) {
    const t = useTranslate();

    const result = getResult(lives, points);

    const subTitleText = finalText ? finalText : t("common.final.gameWinSubtitle");
    
    const pointsElement = (
        <AnimatingNumber
            value={points}
            decimals={3}
            className={classes.pointsValue}
            delay={DELAY}
        />
    )

    if(result === RESULTS.WIN) {
        return (
            <GameWin
                points={pointsElement}
                title={t("common.final.gameWinTitle")}
                subtitle={subTitleText}
            />
        )
    }

    if(result === RESULTS.LOST) {
        return (
            <GameOver
                title="Game Over"
                points={pointsElement}
            />
        )
    }

    return (
        <GameAchieved
            points={pointsElement}
            title={t("common.final.gameAchievedTitle")}
            subtitle={subTitleText}
        />
    );
}

Score.propTypes = {
    lives: PropTypes.any,
    points: PropTypes.number.isRequired,
    finalText: PropTypes.string
}

