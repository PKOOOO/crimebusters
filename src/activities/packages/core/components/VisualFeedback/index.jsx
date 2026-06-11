import { motion, useAnimation } from "framer-motion";
import classes from "./VisualFeedback.module.scss";
import clsx from "clsx";
import { forwardRef, useState, useImperativeHandle } from "react";

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const VisualFeedback = forwardRef(function VisualFeedback( _props, ref) {
    const [isCorrect, setIsCorrect] = useState(false);
    const animationControls = useAnimation();
    
    useImperativeHandle(ref, () => ({
        show: async ({ isCorrect, duration }) => {            
            setIsCorrect(isCorrect);

            await animationControls.start({ opacity: 1, transition: { duration: .1 } })
            await wait(duration);
            animationControls.start({ opacity: 0, transition: { duration: .5 } })
        },
    }));

    return (
        <motion.div 
            style={{ opacity: 0 }}
            animate={animationControls}
            className={clsx(classes.feedback, { [classes.success]: isCorrect, [classes.error]: !isCorrect })}
        />
    )
});