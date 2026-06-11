import PropTypes from 'prop-types'

/**
 * @param {string} className - classes that you want to put on the icon.
 * @param {function} onClick - function that execute when icon recive a click.
 * @param {string} color - color of the Icon.
 * @returns {React.ReactNode} - return an Contract Icon. 
 */
export function Contract(props) {
    const { className, onClick, color = "currentColor" } = props;

    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none" className={className} onClick={onClick}>
            <path fillRule="evenodd" clipRule="evenodd" d="M0 3C0 1.34315 1.34315 0 3 0H17C18.6569 0 20 1.34315 20 3V17C20 18.6569 18.6569 20 17 20H3C1.34315 20 0 18.6569 0 17V3ZM3 2C2.44772 2 2 2.44772 2 3V17C2 17.5523 2.44772 18 3 18H17C17.5523 18 18 17.5523 18 17V3C18 2.44772 17.5523 2 17 2H3Z" fill={color} />
            <path fillRule="evenodd" clipRule="evenodd" d="M5 10C5 9.44771 5.44772 9 6 9H14C14.5523 9 15 9.44771 15 10C15 10.5523 14.5523 11 14 11H6C5.44772 11 5 10.5523 5 10Z" fill={color} />
        </svg>
    );
}

Contract.propTypes = {
    className: PropTypes.string,
    onClick: PropTypes.func
}