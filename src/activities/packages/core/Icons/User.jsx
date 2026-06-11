import PropTypes from 'prop-types'

/**
 * @param {string} className - classes that you want to put on the icon.
 * @param {string} color - color that you want to put on the Icon.
 * @param {number|string} size - width and height for the icon (default 30).
 * @returns {React.ReactNode} - return a User Icon.
 */
export function User(props) {
    const { className, color = "currentColor", size = 30 } = props;

    return (
        <svg className={className} width={size} height={size} viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" clipRule="evenodd" d="M15.905 16C18.8699 16 21.235 18.2659 21.9685 21.1494C22.0551 21.4906 21.9562 21.8522 21.7077 22.1016C19.9254 23.8899 17.5659 24.9999 14.9597 25C12.3967 24.9999 10.0711 23.9263 8.29953 22.1895C8.04852 21.9432 7.9456 21.5831 8.02805 21.2412C8.73516 18.3129 11.1177 16.0001 14.114 16H15.905ZM14.114 18C12.3956 18.0001 10.8057 19.2357 10.1345 21.1572C11.5016 22.3258 13.1707 22.9999 14.9597 23C16.7808 22.9999 18.4765 22.2998 19.8572 21.0918C19.1722 19.2077 17.6036 18 15.905 18H14.114Z" fill={color} />
            <path fillRule="evenodd" clipRule="evenodd" d="M15.1404 5C17.9184 5 20.1931 7.22644 20.1931 10C20.1931 12.7735 17.9184 15 15.1404 15C12.3627 14.9996 10.0886 12.7733 10.0886 10C10.0886 7.22666 12.3627 5.00038 15.1404 5ZM15.1404 7C13.4428 7.00038 12.0886 8.35554 12.0886 10C12.0886 11.6444 13.4428 12.9996 15.1404 13C16.8382 13 18.1931 11.6447 18.1931 10C18.1931 8.35529 16.8382 7 15.1404 7Z" fill={color} />
        </svg>
    );
}

User.propTypes = {
    className: PropTypes.string,
    color: PropTypes.string,
    size: PropTypes.oneOfType([PropTypes.number, PropTypes.string])
}
