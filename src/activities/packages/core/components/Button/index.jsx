import classes from './Button.module.scss'
import PropTypes from 'prop-types'
import clsx from 'clsx';
import { forwardRef } from 'react';

/**
 * @param {React.ReactNode} children - element that will be contained within the button.
 * @param {string} className - classes that you want to put on the button.
 * @param {React.ReactNode} icon - icon that will have the button.
 * @param {boolean} disabled - used to disable the button.
 * @param {function} onClick - function that is executed when clicked.
 * @returns {React.ReactNode} - return Button. 
 */

export const Button = forwardRef(function Button(props, ref) {
    const { children, className, icon, href, ...htmlProps } = props;
    const Component = href ? 'a' : 'button';
    const type = href ? undefined : 'button';


    return (
        <Component className={clsx(classes.button, className)} type={type} href={href} {...htmlProps} ref={ref} >
            {icon && (
                <span className={classes.svg}>
                    {icon}
                </span>
            )}

            <span className={classes.content}>
                {children}
            </span>
        </Component>
    )
})

Button.propTypes = {
    children: PropTypes.node,
    icon: PropTypes.node,
    className: PropTypes.string,
    disabled: PropTypes.bool,
    onClick: PropTypes.func,
    href: PropTypes.string,
}