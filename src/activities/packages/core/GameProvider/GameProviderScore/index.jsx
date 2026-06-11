import { useEffect } from 'react';
import classes from './Final.module.scss'
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import clsx from 'clsx';
import { FinalDetails } from './FinalDetails';
import { Score } from './Score';
import { useSelector } from "react-redux";
import { RatingScreen } from './RatingScreen';
import { useCustomHandlers } from '../CustomHandlersProvider/useCustomHandlers';
import { useFullScreen } from '@educaplay/core';

const defaultReportMapper = (question) => {
    const isCorrect = question.answer && question.checkAnswer(question.answer)

    return {
        s: question.answer === '' ? false : isCorrect,
        i: question.id,
        a: question.answer
    }
};

export function GameProviderScore(props) {
    const { onRestart } = props;
    const points = useSelector(state => state.game.points);
    const time = useSelector(state => state.game.time);
    const showClock = useSelector(state => state.game.showClock);
    const pointsRoundedFormatted = useSelector(state => state.game.pointsRoundedFormatted);
    const questions = useSelector(state => state.game.questions);
    const lives = useSelector(state => state.game.lives);
    const finalText = useSelector(state => state.game.finalText);
    const user = useSelector(state => state.game.user);
    const rating = useSelector(state => state.settings.rating);
    const hasInfinityTries = useSelector(state => state.game.hasInfinityTries);
    const [,setOpenFullScreen] = useFullScreen();

    const { mappers } = useCustomHandlers();
    const reportMapper = mappers.report || defaultReportMapper;

    const isLost = lives === 0 || points < 50;
    
    useEffect(() => {
        setOpenFullScreen(false);

        const data = {
            points: Number(pointsRoundedFormatted),
            // -1 es el centinela de "sin tiempo": el backend no lo registra como duración
            time: showClock ? time : -1,
            reports: {
                m: { s: isLost ? 0 : 1 },
                r: questions.filter(question => question.answer !== null)
                            .map(reportMapper)
                            .filter(question => !!question)
            }
        }

        if(hasInfinityTries) data.reports.r = data.reports.r.flat();
        
        const event = new CustomEvent("activity-finish", {
            detail: data
        });
        window.dispatchEvent(event);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    return (
        <>
        <div className={classes.containerWrapper}>
            <motion.div animate={{ opacity: 1 }} initial={{ opacity: 0 }} className={clsx(classes.container, classes.scrollbar, isLost && classes.darkcontainer)}>
                <motion.div initial={{ y: "-100%" }} animate={{  y: 0 }} transition={{ delay : .3}} className={classes.scoreTitle}>
                    <Score lives={lives} points={points} finalText={finalText} />
                </motion.div>

                <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} transition={{ delay : .65}} className={classes.background}>
                    <FinalDetails
                        user={user}
                        onRestart={onRestart}
                    />
                </motion.div>
            </motion.div>
        </div>
        {(rating !== false && rating.url) && <RatingScreen ratingUrl={rating.url} user={user} />}
        </>
    );
}

GameProviderScore.propTypes = {
    onRestart: PropTypes.func,
}

