import PropTypes from 'prop-types'

/**
 * @param {string} className - classes that you want to put on the icon.
 * @param {string} color - color that you want to put on the Icon.
 * @param {number|string} size - width and height for the icon (default 30).
 * @returns {React.ReactNode} - return a Multiplayer Icon.
 */
export function Multiplayer(props) {
    const { className, color = "currentColor", size = 30 } = props;

    return (
        <svg className={className} width={size} height={size} viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" clipRule="evenodd" d="M13 10.0195C13.0004 9.23947 13.8354 8.77352 14.4883 9.12988L14.6162 9.21191L18.5889 12.1924C19.1275 12.5964 19.1275 13.4036 18.5889 13.8076L14.6162 16.7881C13.9505 17.2874 13.0004 16.8125 13 15.9805V10.0195ZM15 14L16.333 13L15 11.999V14Z" fill={color} />
            <path fillRule="evenodd" clipRule="evenodd" d="M23 5C24.6569 5 26 6.34315 26 8V18C26 19.6569 24.6569 21 23 21H17.9141L20.207 23.293C20.5975 23.6835 20.5975 24.3165 20.207 24.707C19.8165 25.0975 19.1835 25.0975 18.793 24.707L16.5 22.4141V24.5C16.5 25.0523 16.0523 25.5 15.5 25.5C14.9477 25.5 14.5 25.0523 14.5 24.5V22.4141L12.207 24.707C11.8165 25.0975 11.1835 25.0975 10.793 24.707C10.4024 24.3165 10.4024 23.6835 10.793 23.293L13.0859 21H8C6.34315 21 5 19.6569 5 18V8C5 6.34315 6.34315 5 8 5H23ZM8 7C7.44772 7 7 7.44772 7 8V18C7 18.5523 7.44772 19 8 19H23C23.5523 19 24 18.5523 24 18V8C24 7.44772 23.5523 7 23 7H8Z" fill={color} />
        </svg>
    );
}

Multiplayer.propTypes = {
    className: PropTypes.string,
    color: PropTypes.string,
    size: PropTypes.oneOfType([PropTypes.number, PropTypes.string])
}
