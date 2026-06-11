import React from 'react';
import PropTypes from 'prop-types';
import clsx from 'clsx';
import classes from './Dropdown.module.scss';
import { useDropdown } from '../Dropdown/DropdownContext';


const DropdownItem = ({ className, children, href, target, disabled, onClick, ...props }) => {
    const defaultRel = target === "_blank" ? "noopener" : undefined;
    const { setIsOpen } = useDropdown();

    const classnames = clsx(classes.item, className, { [classes.disabled]: disabled });

    const handleClick = (e) => {
        setIsOpen(false);
        onClick?.(e);
    }

    if (href) {
        return (
            <a
                className={classnames}
                href={href}
                target={target}
                rel={defaultRel}
                onClick={handleClick}
                {...props}
            >
               
                <span>{children}</span>
            </a>
        );
    }

    return (
        <button type="button" className={classnames} disabled={disabled} onClick={handleClick} {...props}>
            
            <span>{children}</span>
        </button>
    );
}

DropdownItem.propTypes = {
    icon: PropTypes.string,
    onClick: PropTypes.func,
    disabled: PropTypes.bool,
    className: PropTypes.string,
    href: PropTypes.string,
    target: PropTypes.oneOf(['_blank', '_self', '_parent', '_top']),
    children: PropTypes.node,
    isBusy: PropTypes.bool,
};

export default DropdownItem;