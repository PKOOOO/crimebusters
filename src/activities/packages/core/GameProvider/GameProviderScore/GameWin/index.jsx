/* eslint-disable no-unused-vars */
import PropTypes from 'prop-types';
import classes from './GameWin.module.scss'
import Confetti from 'react-confetti';
import { useEffect, useState } from 'react';
import { useGameSounds, useTranslate } from '@educaplay/core/hooks';
import { NAME_SOUND_WIN } from '@educaplay/core'
import { TrophyWin } from '@educaplay/core/Icons/TrophyWin';
import Halo from '../Halo';

function GameWin(props) {

    const { points, title, subtitle } = props;
    const gameSounds = useGameSounds();
    const [windowSize, setWindowSize] = useState({
        width: window.innerWidth,
        height: window.innerHeight,
    });
    const t = useTranslate();

    useEffect(() => {
        const handleResize = () => {
            setWindowSize({
                width: window.innerWidth,
                height: window.innerHeight,
            });
        };

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);


    useEffect(() => {
        gameSounds.play(NAME_SOUND_WIN)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <>
            <div className={classes.haloContainer}>
                <Halo />
            </div>
            <div className={classes.confettiWrapper}>
                <Confetti gravity={0.02} width={windowSize.width} height={windowSize.height} />
            </div>

            <div className={classes.titleWrapper}>
                <div className={classes.title}>{title}</div>
                <div className={classes.subtitle}>{subtitle}</div>
                <div className={classes.trophyContainer}>
                    <TrophyWin className={classes.trophywin} />
                </div>
                <div className={classes.pointsWrapper}>
                    <span className={classes.pointsTitle}>{t("common.game.points")}</span>
                    {points}
                </div>
            </div>
        </>
    );
}

GameWin.propTypes = {
    points: PropTypes.node,
    title: PropTypes.string,
    subtitle: PropTypes.string
}

export default GameWin;