import { forwardRef, useImperativeHandle } from 'react';
import { motion, useAnimate } from "framer-motion"
import PropTypes from 'prop-types'
import clsx from 'clsx';

import { Heart as LiveIcon } from '@educaplay/core/Icons/Heart';
import { Educapoint as PointsIcon } from '@educaplay/core/Icons/Educapoint';
import { useTranslate } from '@educaplay/core/hooks';

import classes from './Header.module.scss'
import Counter from './Counter';
import { useSelector } from 'react-redux';

/** 
 * @param {string} topic - activity's topic
 * @param {Object} infoLive - object that indicates if infoLive are activated and their value.
 * @param {number} pointsValue - value of the points
 * @returns {React.ReactNode} - return header of the Activity. 
 */
export const Header = forwardRef(function Header(props, ref) {
    const { animated, className } = props;
    const title = useSelector(state => state.game.title);
    const pointsFormatted = useSelector(state => state.game.pointsFormatted);
    const lives = useSelector(state => state.game.lives);
    const liveActived = useSelector(state => state.game.liveActived);
    const negativePoints = useSelector(state => state.game.negativePoints);

    const t = useTranslate();
    const [headerRef, animateHeader] = useAnimate();

    useImperativeHandle(ref, () => ({
        animateEntry: async (options = {}) => {
            await animateHeader(headerRef.current, { y: "0%" }, { ease: "easeInOut", ...options });
        },
        animateExit: async (options = {}) => {
            await animateHeader(headerRef.current, { y: "-100%" }, { ease: "easeInOut", ...options });
        }
    }));

    const negativePointsBox = negativePoints !== null && (
        <div className={classes.negativepointsbox}>
            <span className={classes.negativepoints}>
                {`-${negativePoints.toFixed(3)}`}
            </span>
        </div>
    )

    return (
        <motion.header initial={{ y: animated ? "-100%" : 0 }} ref={headerRef} className={clsx(classes.header, className)}>
            <div className={classes.header__wrapper}>
                <Counter
                    title={t("common.game.lives")}
                    icon={<LiveIcon />}
                    value={lives}
                    className={clsx(classes.leftSide, !liveActived && classes.liveshidden)}
                />

                <h1 className={classes.topic}>
                    {title}
                </h1>

                <Counter
                    title={t("common.game.points")}
                    icon={<PointsIcon />}
                    value={pointsFormatted}
                    className={classes.rightSide}
                    additionalContent={negativePointsBox}   
                />
            </div>
        </motion.header>
    );
})

Header.propTypes = {
    animated: PropTypes.bool,
    className: PropTypes.string
}
