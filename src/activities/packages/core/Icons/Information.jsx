import PropTypes from 'prop-types'

/**
 * @param {string} className - classes that you want to put on the icon.
 * @param {string} color - color of the Icon.
 * @returns {React.ReactNode} - return an Information Icon. 
 */
export function Information(props) {
    const { className, color = "currentColor"  } = props;

    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="23" viewBox="0 0 15 23" fill="none" className={className}>
            <path d="M2 6C1.44772 6 1 6.44772 1 7C1 7.55228 1.44772 8 2 8H6.5V21H1C0.447715 21 0 21.4477 0 22C0 22.5523 0.447715 23 1 23H14C14.5523 23 15 22.5523 15 22C15 21.4477 14.5523 21 14 21H8.5V7C8.5 6.44772 8.05228 6 7.5 6H2Z" fill={color}  />
            <path d="M8.5 1.5C8.5 2.32843 7.82843 3 7 3C6.17157 3 5.5 2.32843 5.5 1.5C5.5 0.671573 6.17157 0 7 0C7.82843 0 8.5 0.671573 8.5 1.5Z" fill={color} />
        </svg>
    );
}

Information.propTypes = {
    className: PropTypes.string,
    color: PropTypes.string
}