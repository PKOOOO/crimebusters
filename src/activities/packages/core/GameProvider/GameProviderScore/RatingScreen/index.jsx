import { useEffect, useState } from 'react';
import classes from './RatingScreen.module.scss'
import { useTranslate } from '@educaplay/core/hooks';
import {
    useFloating,
    useInteractions,
    useRole,
    useDismiss,
    FloatingPortal,
    FloatingFocusManager,
} from "@floating-ui/react";
import { AnimatePresence, motion } from "framer-motion";
import { trackError } from '@educaplay/core/utils';

export function RatingScreen(prop) {
    const { ratingUrl, user} = prop;
    const t = useTranslate();
    const [attempt, setAttempt] = useState(null);
    const [open, setOpen] = useState(false);
  
    const onClose = () => setOpen(false);

    const { floating, context } = useFloating({
        open,
        onOpenChange: (open) => {
            if (!open) onClose();
        },
    });
    
    const { getFloatingProps } = useInteractions([
        useRole(context, { role: "dialog" }),
        useDismiss(context),
    ]);

    const handleSkip = (ev) => {
        ev.preventDefault();
        onClose()
    }

    const [hover, setHover] = useState(0);

    useEffect(()=>{
        const handleShowRating = (event) => {
            if(!event.detail?.attempt) return;
            setAttempt(event.detail.attempt);
            setOpen(true);
        }
    
        window.addEventListener('activity-show-rating', handleShowRating);
    
        return () => {
            window.removeEventListener('activity-show-rating', handleShowRating);
        }
    }, []);
    

    const onClick = (rating) => {
        const headers = user.type === 'anonymous'
            ? { 'X-Anonymous-Token': user.token }
            : { 'Authorization': `Bearer ${user.token}` };
        const body = "rating=" + rating + "&attempt=" + attempt;

        fetch(ratingUrl, {
            method: "PUT",
            headers,
            body: body
        }).catch((error) => {
            trackError(error);
        });

        onClose()
    }

    return (
        <FloatingPortal>
            <AnimatePresence>
                {open && (
                    <motion.div
                        key="dialog-rating"
                        initial={{ y: "-100%" }}
                        animate={{ y: 0, transition: { delay: 1.5, duration: .5, ease: "easeInOut" }}}
                        exit={{ y: "-100%", transition: { duration: .5, ease: "easeInOut"} }}
                        {...getFloatingProps({
                        ref: floating,
                        className: classes.background,
                    })}>
                        <FloatingFocusManager context={context}>
                            <div className={classes.title}>{t('common.final.ratingTitle')}</div>
                            <div className={classes.starWrapper}>
                                {[...Array(5)].map((element,index) => {
                                    return (
                                        <button type="button" key={index+1} className={classes.button} onClick={() => onClick(index+1)} onMouseEnter={() => setHover(index+1)} onMouseLeave={() => setHover(0)}>
                                            <svg version="1.1" className={index+1 <= hover ? classes.on : classes.of} viewBox="0 12.705 512 486.59" x="0px" y="0px"  width="50px" height="50px" fill="#fafff3" ><polygon points="256.814,12.705 317.205,198.566 512.631,198.566 354.529,313.435 414.918,499.295 256.814,384.427 98.713,499.295 159.102,313.435 1,198.566 196.426,198.566 "></polygon></svg>
                                        </button>
                                    );
                                })}
                            </div>
                            <a href='#' onClick={handleSkip} className={classes.link}>{t('common.final.ratingSkip')}</a>
                        </FloatingFocusManager>
                    </motion.div>
                )}
            </AnimatePresence>
        </FloatingPortal>
    );
}