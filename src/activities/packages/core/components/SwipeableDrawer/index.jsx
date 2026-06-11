import {
    useFloating,
    useInteractions,
    useRole,
    useDismiss,
    FloatingPortal,
    FloatingOverlay,
    FloatingFocusManager,
} from "@floating-ui/react";
import { AnimatePresence, motion, useDragControls, useAnimationControls } from 'framer-motion';

import PropTypes from "prop-types";
import classes from "./SwipeableDrawer.module.scss";
import clsx from "clsx";
import { useMediaQuery, useDebounceCallback } from "@educaplay/core/hooks";

const MotionDialogOverlay = motion.create(FloatingOverlay);
const MIN_SWIPE_DISTANCE = 40;

export function SwipeableDrawer(props) {
    const { open, onClose, children, className, disableClickOverlay = false } = props;
    const isDesktop = useMediaQuery("md");

    const direction = isDesktop ? "x" : "y";
    const distance = isDesktop ? "-100%" : "100%";

    const dragControls = useDragControls();
    const animationControls = useAnimationControls();
    const dragConstraints = isDesktop ? { right: 0 } : { top: 0 };
    const debounced = useDebounceCallback(onClose, 50);

    const { floating, context } = useFloating({
        open,
        onOpenChange: () => {
            if (open) onCloseDebounced();
        },
    });

    const onCloseDebounced = () => {
        debounced();
    }

    const { getFloatingProps } = useInteractions([
        useRole(context, { role: "dialog" }),
        useDismiss(context, { outsidePress: !disableClickOverlay }),
    ]);

    const handleDragEnd = (event, info) => {
        const isFromSwipe = event.target.classList.contains(classes.swipe);
        if (isFromSwipe) {
            onCloseDebounced();
            return;
        }
        if (isDesktop && info.offset.x < -MIN_SWIPE_DISTANCE) {
            onCloseDebounced();
        } else if (isDesktop) {
            animationControls.start({ x: 0 });
        } else if (!isDesktop && info.offset.y > MIN_SWIPE_DISTANCE) {
            onCloseDebounced();
        } else if (!isDesktop) {
            animationControls.start({ y: 0 });
        }
    }

    const handleClick = (event) => {
        if (event.target.classList.contains(classes.swipe)) {
            onCloseDebounced();
        }
    }

    return (
        <FloatingPortal id="swipeable-drawer-portal-element">
            <AnimatePresence>
                {open && (
                    <MotionDialogOverlay
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, transition: { delay: .3 } }}
                        transition={{ duration: .15 }}
                        lockScroll
                        className={classes.overlay}
                        style={{ pointerEvents: disableClickOverlay ? "none" : "all" }}
                    >
                        <FloatingFocusManager context={context}>
                            <motion.div
                                initial={{ [direction]: distance }}
                                animate={{ [direction]: 0 }}
                                exit={{ [direction]: distance }}
                                transition={{ duration: 0.3, ease: "easeOut" }}
                                {...getFloatingProps({
                                    ref: floating,
                                    className: classes.drawer,
                                    style: { cursor: isDesktop ? "grab" : "grabbing", pointerEvents: "all" },
                                })}
                            >
                                <motion.div
                                    drag={direction}
                                    className={clsx(classes.drawerBox, className)}
                                    dragConstraints={dragConstraints}
                                    dragControls={dragControls}
                                    dragElastic={0.01}
                                    onDragEnd={handleDragEnd}
                                    dragTransition={{ bounceDamping: 30, bounceStiffness: 800 }}
                                    animate={animationControls}
                                    onClick={handleClick}
                                >
                                    <div className={classes.swipeContainer}>
                                        <div className={classes.swipe} />
                                    </div>

                                    <div className={clsx(classes.content, classes.scrollbar)}>
                                        {children}
                                    </div>
                                </motion.div>
                            </motion.div>
                        </FloatingFocusManager>
                    </MotionDialogOverlay>
                )}
            </AnimatePresence>
        </FloatingPortal>
    )
}

SwipeableDrawer.propTypes = {
    open: PropTypes.bool.isRequired,
    children: PropTypes.node.isRequired,
    onClose: PropTypes.func.isRequired,
    className: PropTypes.string,
    disableClickOverlay: PropTypes.bool,
}