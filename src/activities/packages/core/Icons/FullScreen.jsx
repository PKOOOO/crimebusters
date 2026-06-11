import PropTypes from 'prop-types'

/**
 * @param {string} className - classes that you want to put on the icon.
 * @param {string} color - color of the icon.
 * @returns {React.ReactNode} - return an Fullscreen Icon. 
 */
export function FullScreen(props) {
    const { className, color = "currentColor" } = props;

    return (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className={className}>
            <path fillRule="evenodd" clipRule="evenodd" d="M0 3C0 1.34315 1.34315 0 3 0H6C6.55228 0 7 0.447715 7 1C7 1.55228 6.55228 2 6 2H3C2.44772 2 2 2.44772 2 3V6C2 6.55228 1.55228 7 1 7C0.447715 7 0 6.55228 0 6V3ZM13 1C13 0.447715 13.4477 0 14 0H17C18.6569 0 20 1.34315 20 3V6C20 6.55228 19.5523 7 19 7C18.4477 7 18 6.55228 18 6V3C18 2.44772 17.5523 2 17 2H14C13.4477 2 13 1.55228 13 1ZM1 13C1.55228 13 2 13.4477 2 14V17C2 17.5523 2.44772 18 3 18H6C6.55228 18 7 18.4477 7 19C7 19.5523 6.55228 20 6 20H3C1.34315 20 0 18.6569 0 17V14C0 13.4477 0.447715 13 1 13ZM19 13C19.5523 13 20 13.4477 20 14V17C20 18.6569 18.6569 20 17 20H14C13.4477 20 13 19.5523 13 19C13 18.4477 13.4477 18 14 18H17C17.5523 18 18 17.5523 18 17V14C18 13.4477 18.4477 13 19 13Z" fill={color} />
        </svg>
    );
}

FullScreen.propTypes = {
    className: PropTypes.string,
    color: PropTypes.string
}

