import React, { useEffect } from "react";
import {
    useFloating,
    useInteractions,
    useRole,
    FloatingPortal,
    FloatingOverlay,
    FloatingFocusManager,
    useDismiss,
} from "@floating-ui/react";
import { AnimatePresence, motion } from "framer-motion";
import PropTypes from "prop-types";
import classes from "./Dialog.module.scss";
import clsx from "clsx";
import { Close } from "@educaplay/core/Icons/Close";

export function Dialog(props) {
    const { open, onClose, children, className, variant, animated = false } = props;


    const { floating, context } = useFloating({
        open,
        onOpenChange: (open) => {
            if (!open) onClose();
        },
    });

    const { getFloatingProps } = useInteractions([
        useRole(context, { role: "dialog" }),
        useDismiss(context, {
            outsidePress: false
        })
    ]);

    const dialogClassName = clsx(classes.dialog, className, {
        [classes.confirm]: variant === "confirm",
        [classes.lightbox]: variant === "lightbox",
        [classes.explanation]: variant === "explanation",
    });

    const initialY = animated ? { y: "150%" } : false;

    useEffect(() => {
        window.addEventListener('activity-finish', onClose);
        return () => {
            window.removeEventListener('activity-finish', onClose);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    return (
        <FloatingPortal>
            <AnimatePresence>
                {open && (
                    <motion.div key="dialog-group" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { delay: .25 } }} onClick={onClose}>
                        <FloatingOverlay className={classes.overlay} >
                            <FloatingFocusManager context={context}>
                                <motion.div initial={initialY} animate={{ y: "0%" }} transition={{ delay: .4, duration: 0.3, type: "spring", bounce: .2 }} className={classes.dialogwrapper}>
                                    <motion.div {...getFloatingProps({
                                        ref: floating,
                                        className: dialogClassName,
                                    })}
                                        initial={{ opacity: 0, scale: .8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: .8 }}
                                        transition={{ duration: .5, delay: .15, type: "spring", bounce: .5 }}
                                    >
                                        <button type="button" onClick={onClose} className={classes.closeButton}>
                                            <Close size={16} />
                                        </button>

                                        <div className={classes.content}>
                                            {children}
                                        </div>
                                    </motion.div>
                                </motion.div>
                            </FloatingFocusManager>
                        </FloatingOverlay>
                    </motion.div>
                )}
            </AnimatePresence>
        </FloatingPortal>
    )
}

Dialog.propTypes = {
    open: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    children: PropTypes.node.isRequired,
    variant: PropTypes.oneOf(["confirm", "lightbox", "explanation"]),
    className: PropTypes.string,
}
