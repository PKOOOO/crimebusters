import React from "react";
import PropTypes from "prop-types";
import classes from "./Dropdown.module.scss";
import clsx from "clsx";
import { useDropdown } from './DropdownContext';

export default function DropdownToggle({ children, className, ...rest }) {
    const { isOpen, reference, getReferenceProps } = useDropdown();

    return (
        <button
            type="button"
            ref={reference}
            className={clsx(classes.toggle, className, { [classes.open]: isOpen })}
            {...rest}
            {...getReferenceProps()}
        >
            {children}
        </button>
    );
}

DropdownToggle.propTypes = {
    children: PropTypes.node,
    className: PropTypes.string,
};