import { FullScreen } from '@educaplay/core/Icons/FullScreen';
import { FullScreenReduce } from '@educaplay/core/Icons/FullScreenReduce';
import { Options } from '@educaplay/core/Icons/Options';
import classes from './Footer.module.scss'
import { forwardRef, useImperativeHandle } from 'react';
import { useFullScreen, useTranslate, useMultiplayer } from "@educaplay/core/hooks";
import { toggleSettings } from "@educaplay/store/slices/settingsSlice";
import { Settings } from '../Settings';
import { EmojiPicker } from '../EmojiReactions/EmojiPicker';
import PropTypes from 'prop-types';
import { motion, useAnimate, AnimatePresence } from "framer-motion"
import { IconButton, Slot } from "@educaplay/core/components";
import { useSelector, useDispatch } from 'react-redux';
import { Clock } from '@educaplay/core/components';

/**
 * @param {React.ReactNode} clock - type of clock that the activity will have.
 * @param {string} gameData - Data of the Game.
 * @param {function} onFinishGame - Function to finish the game.
 * @returns {React.ReactNode} - return the footer of the Activity. 
 */
export const Footer = forwardRef(function Footer(props, ref) {
    const { animated, showClock, onTimeFinish, clockFreezed } = props;

    const customBarLogo = useSelector(state => state.settings.customBarLogo);
    const isOpen = useSelector(state => state.settings.isOpen);
    const { isMultiplayer } = useMultiplayer();
    const [fullScreen, setFullScreen] = useFullScreen();
    const [containerRef, animateContainer] = useAnimate();
    const dispatch = useDispatch();

    useImperativeHandle(ref, () => ({
        animateEntry: async (options = {}) => {
            await animateContainer(containerRef.current, { y: "0%" }, options);
        },
        animateExit: async (options = {}) => {
            await animateContainer(containerRef.current, { y: "100%" }, options);
        }
    }))
    const t = useTranslate();

    const optionsClickHandler = () => {
        dispatch(toggleSettings(!isOpen))
    }

    const fullScreenClickHandler = () => {
        setFullScreen(true)
    }

    const fullScreenReduceClickHandler = () => {
        setFullScreen(false)
    }


    return (
        <>
            <Settings
                open={isOpen}
                onClose={() => dispatch(toggleSettings(false))}
            />

            <motion.div ref={containerRef} initial={{ y: animated ? "100%" : 0 }} className={customBarLogo ? classes.corporativeFooter : classes.footer}>
                <AnimatePresence initial={false}>
                    {showClock && (
                        <motion.div
                            key="clock"
                            initial={{ y: "120%", opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: "120%", opacity: 0 }}
                            transition={{ duration: 0.3, ease: "easeOut" }}
                            style={{ display: "flex", alignItems: "end" }}
                        >
                            <Clock onTimeFinish={onTimeFinish} freezed={clockFreezed} />
                        </motion.div>
                    )}
                </AnimatePresence>
                <div className={classes.buttons}>
                    <div className={classes.buttonWrapper}>
                        <IconButton icon={<Options className={classes.button} />} onClick={optionsClickHandler} className={isOpen ? classes.actived : null} lectormsg={t("common.accesibility.settings")} />
                    </div>
                    <div className={classes.buttonWrapper}>
                        <Slot name="core-footer-buttons-right" />
                        {isMultiplayer && <EmojiPicker buttonClassName={classes.button} />}
                        {fullScreen
                            ? <IconButton icon={<FullScreenReduce className={classes.button} />} onClick={fullScreenReduceClickHandler} lectormsg={t("common.accesibility.exitFullscreen")} />
                            : <IconButton icon={<FullScreen className={classes.button} />} onClick={fullScreenClickHandler}  lectormsg={t("common.accesibility.fullscreen")} />
                        }
                    </div>
                </div>
            </motion.div>
        </>
    );
})

Footer.propTypes = {
    onTimeFinish: PropTypes.func,
    animated: PropTypes.bool,
    showClock: PropTypes.bool
}