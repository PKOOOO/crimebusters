
import clsx from 'clsx';
import classes from './ProgressBar.module.scss'
import {motion} from 'framer-motion';

export function ProgressBar({ value = 0, className }){

    return (
        <motion.div
            initial={{ y: -100}}
            animate={{ y: 0}}
            exit={{ y: -100}}
            transition={{ duration: .5, type: "spring", bounce: .2 }}
            role="progressbar"
            aria-valuenow={value}
            className={clsx(classes.progressBarContainer,className)}
        >
            <div className={classes.progress} style={{width: `${value}%`}}/>
        </motion.div>
    );

}