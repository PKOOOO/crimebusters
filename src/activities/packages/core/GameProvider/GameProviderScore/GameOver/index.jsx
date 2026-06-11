import PropTypes from 'prop-types';
import classes from './GameOver.module.scss'
import { useEffect } from 'react';
import { useGameSounds, useTranslate } from '@educaplay/core/hooks';
import { NAME_SOUND_LOSS } from '@educaplay/core'

function GameOver(props) {
    const { points, title } = props;
    const gameSounds = useGameSounds();
    const t = useTranslate();

    useEffect(() => {
        gameSounds.play(NAME_SOUND_LOSS)    
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        
            <div className={classes.titleWrapper}>
                <div className={classes.title}>{title}</div>
                <div className={classes.pointsWrapper}>
                    <span className={classes.pointsTitle}>{t("common.game.points")}</span>
                    {points}
                </div>
            </div>

        
    );
}

GameOver.propTypes = {
    points: PropTypes.node,
    title: PropTypes.string
}


export default GameOver;