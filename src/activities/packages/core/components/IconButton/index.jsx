import classes from './IconButton.module.scss'
import PropTypes from 'prop-types'
import clsx from 'clsx';

/**
 * @param {string} className - classes that you want to put on the button.
 * @param {React.ReactNode} icon - icon that will have the button.
 * @param {function} onClick - function to be executed when clicked.
 * @param {string} type - type of button.
 * @returns {React.ReactNode} - return an Icon Button. 
 */
export function IconButton(props) {
    const { className, icon,type = 'button',lectormsg, ...htmlProps } = props;

    return (
        <button type={type} aria-label={lectormsg} className={clsx(classes.button, className)} {...htmlProps} >
            {icon}
        </button>
    );
}

IconButton.propTypes = {
    className: PropTypes.string,
    icon: PropTypes.node,
    onClick: PropTypes.func,
    type: PropTypes.string,
}