import { useState } from 'react';
import classes from './FinalDetails.module.scss';
import PropTypes from 'prop-types';
import { Button } from "@educaplay/core";
import { Restart } from '@educaplay/core/Icons/Restart';
import { ActivityLogin } from '../../ActivityLogin';
import { Facebook } from '@educaplay/core/Icons/Facebook';
import { motion } from 'framer-motion';
import { BannerAds } from '../../BannerAds';
import { useTranslate } from '@educaplay/core/hooks';
import { Expand } from '@educaplay/core/Icons/Expand';
import { Contract } from '@educaplay/core/Icons/Contract';
import { useSelector } from 'react-redux';
import { Results } from '../Results';
import { Accordion } from '../../Accordion';
import { useCustomHandlers } from '../../CustomHandlersProvider/useCustomHandlers';
import clsx from 'clsx';

export function FinalDetails(props) {
    const { onRestart, user } = props;
    const [showReports, setShowreports] = useState(false);
    const t = useTranslate();
    const showUser = useSelector(state => state.game.showUser);
    const showRestart = useSelector(state => state.game.showRestart);
    const showSocialMedia = useSelector(state => state.game.showSocialMedia);
    const showSolutions = useSelector(state => state.game.showSolutions);
    const url = useSelector(state => state.game.url);
    const pointsRoundedFormatted = useSelector(state => state.game.pointsRoundedFormatted);
    const questions = useSelector(state => state.game.questions);
    const answers = useSelector(state => state.game.questions).map(question => question.answer);
    const correctAnswers = useSelector(state => state.game.questions).filter(question => question.answer && question.checkAnswer(question.answer));
    const time = useSelector(state => state.game.time);
    const showButtonReports = useSelector(state => state.game.showButtonReports);

    const handleClickReports = () => setShowreports(!showReports);
    const { renders } = useCustomHandlers();


    const formatTime = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;

        const formattedMinutes = String(minutes).padStart(2, '0');
        const formattedSeconds = String(remainingSeconds).padStart(2, '0');

        return `${formattedMinutes}:${formattedSeconds}`;
    }

    return (
        <>
            <div className={classes.tiltedBoxContainer}>
                <div className={classes.tiltedBox}></div>
            </div>

            {showUser && (<ActivityLogin user={user} />)}

            {showRestart && (<div className={classes.restartWrapper}>
                <Button icon={<Restart />} onClick={onRestart} className={clsx(classes.retryButton,classes.restartanimation)}>
                    {t("common.final.retry")}
                </Button>
            </div>)}

            {showSocialMedia && (<div className={classes.shareWrapper}>
                <span>{t("common.final.share")}</span>
                <div className={classes.linkWrapper}>
                    <a href={`https://www.facebook.com/sharer/sharer.php?u=${url}`} rel="noopener noreferrer" target="_parent" title="Facebook" className={classes.shareLink}>
                        <Facebook className={classes.shareLink} />
                    </a>
                </div>
            </div>)
            }

            <div className={classes.scoreWrapper} >
                <div className={`${classes.firstScoreLine} ${classes.scoreLine}`}>
                    <span className={classes.scoreTitle}>{t("common.game.points")}</span>
                    <span className={classes.scoreValue}>{pointsRoundedFormatted}</span>
                </div>
                <div className={classes.scoreLine}>
                    <span className={classes.scoreTitle}>{t("common.final.time")}</span>
                    <span className={classes.scoreValue}>{formatTime(time)}</span>
                </div>
                <div className={classes.scoreLine}>
                    <span className={classes.scoreTitle}>{t("common.final.correct")}</span>
                    <span className={classes.scoreValue}>{correctAnswers.length} / {answers.length}</span>
                </div>
            </div>
            {showButtonReports && (<Button icon={
                <motion.div
                    key={showReports ? "minus" : "plus"}
                    initial={{
                        rotate: showReports ? -90 : 90,
                    }}
                    animate={{
                        zIndex: 1,
                        rotate: 0,
                        transition: {
                            type: "tween",
                            duration: 0.15,
                            ease: "circOut",
                        },
                    }}
                    exit={{
                        zIndex: 0,
                        rotate: showReports ? -90 : 90,
                        transition: {
                            type: "tween",
                            duration: 0.15,
                            ease: "circIn",
                        },
                    }}
                >
                    {showReports ?
                        <Contract />
                        :
                        <Expand className={classes.minusIcon} />}

                </motion.div>}
                className={classes.reportsButton}
                onClick={handleClickReports}
            >
                {t("common.final.results")}
            </Button>)}
            <Accordion show={showReports} className={classes.fullwidth}>
                <div className={classes.reports}>
                    {
                        typeof renders?.results === "function"
                            ? renders.results(questions)
                            : <Results userAnswers={answers} correctAnswers={correctAnswers} questions={questions} showSolutions={showSolutions} />
                    }

                </div>
            </Accordion>
            <BannerAds />
        </>
    );
}

FinalDetails.propTypes = {
    onRestart: PropTypes.func,
    user: PropTypes.object,
    gameData: PropTypes.object,
}

