import PropTypes from 'prop-types'

/**
 * @param {string} className - classes that you want to put on the icon.
 * @param {string} color - color that you want to put on the Icon.
 * @param {number|string} size - width and height for the icon (default 30).
 * @returns {React.ReactNode} - return a Check2 Icon.
 */
export function Check2(props) {
    const { className, color = "currentColor", size = 30 } = props;

    return (
        <svg className={className} width={size} height={size} viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8.27835 8.3285C11.0119 5.13048 15.5233 4.11144 19.3662 5.82361C19.8706 6.04844 20.0978 6.63951 19.8731 7.14393C19.6482 7.64796 19.057 7.8743 18.5528 7.64979C15.5189 6.29806 11.9569 7.1028 9.79886 9.62733C7.64097 12.1521 7.40028 15.7963 9.20804 18.5824C11.0159 21.3683 14.4419 22.6334 17.627 21.6918C20.8116 20.75 22.9977 17.8259 23 14.5053V13.7142C23.0003 13.1621 23.4479 12.7142 24 12.7142C24.5521 12.7143 24.9998 13.1622 25 13.7142V14.5053L24.9922 14.8988C24.8235 18.9418 22.1017 22.4543 18.1934 23.6097C14.159 24.8024 9.82023 23.1993 7.5303 19.6703C5.24068 16.1412 5.54517 11.5264 8.27835 8.3285Z" fill={color} />
            <path d="M25.043 5.77479C25.4335 5.38467 26.0666 5.38454 26.4571 5.77479C26.8475 6.16519 26.8472 6.7983 26.4571 7.18885L15.9815 17.6654C15.5911 18.0558 14.9579 18.0556 14.5674 17.6654L11.71 14.808C11.3195 14.4175 11.3195 13.7845 11.71 13.3939C12.1005 13.0038 12.7336 13.0035 13.1241 13.3939L15.2735 15.5433L25.043 5.77479Z" fill={color} />
        </svg>
    );
}

Check2.propTypes = {
    className: PropTypes.string,
    color: PropTypes.string,
    size: PropTypes.oneOfType([PropTypes.number, PropTypes.string])
}
