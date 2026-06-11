import classes from './Counter.module.scss'
import PropTypes from 'prop-types';
import clsx from 'clsx'

/**
 * @param {string} title - title of the counter.
 * @param {React.ReactNode} icon - icon of the counter.
 * @param {integer} value - initial value of the counter. 
 * @returns {React.ReactNode} - return counter. 
 */
function Counter(props) {

    const {title , icon ,value = 0 , className, additionalContent} = props;
    

    return (

        <div className={clsx(classes.content, className)}>
            <div className={classes.content__title}>{title}</div>
            <div className={classes.content__wrapper}>
                <span className={classes.image}>
                    {icon}
                </span>
                {additionalContent}
                <span className={classes.content__number}>{value}</span>
            </div>
        </div>

    )


}

Counter.propTypes = {
    title: PropTypes.string,
    icon: PropTypes.node,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),   
}

export default Counter;