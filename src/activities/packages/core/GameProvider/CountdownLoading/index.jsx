import PropTypes from 'prop-types';
import clsx from 'clsx';
import classes from "./CountdownLoading.module.scss"
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export function CountdownLoading(props) {
    const {onCountdownEnd, initialCount = 3, size = 'default'} = props;
    const [count, setCount] = useState(initialCount);
    const [exit, setExit] = useState(false);

    useEffect(() => {
        let timer = null;
        if (count === 0) {
            setExit(true);
        } else {
            timer = setTimeout(() => {
                setCount(count - 1);
            }, 1000);
        }
        return () => {
            clearTimeout(timer);
        }
    }, [count]);
    
    const handleTransitionEnd = () => {
        if(exit) onCountdownEnd();
    }

    return (
        <motion.div animate={{ scale: exit ? 0: 1, opacity: exit ? 0: 1 }} className={clsx(classes.container, size === 'small' && classes.small)} onAnimationComplete={handleTransitionEnd}>
            <svg className={classes.shape} width="178" height="178" viewBox="0 0 178 178">
                <path d="M0.392916 12.8483C0.180422 5.89979 5.89825 0.225124 12.845 0.490267L166.069 6.33852C172.668 6.59039 177.823 12.1267 177.605 18.7269L172.925 160.066C172.717 166.347 167.699 171.404 161.419 171.659L17.5548 177.508C10.8857 177.779 5.27694 172.556 5.07292 165.884L0.392916 12.8483Z" fill="currentColor"/>
            </svg>
            
            <div className={classes.text}>
                {count}
            </div>
        </motion.div>
    )
}

CountdownLoading.propTypes = {
    onCountdownEnd: PropTypes.func.isRequired,
    initialCount: PropTypes.number,
    size: PropTypes.oneOf(['default', 'small'])
}