import PropTypes from 'prop-types'

/**
 * @param {string} color - color of the icon.
 * @returns {React.ReactNode} - return a Facebook Icon. 
 */

export function Facebook(props) {

    const { color = "currentColor" } = props;

    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="24" viewBox="0 0 14 24" fill="none">
            <g clipPath="url(#clip0_34_1384)">
                <path d="M12.682 13.5L13.352 9.16H9.182V6.34C9.182 5.15 9.762 3.99 11.632 3.99H13.522V0.29C13.522 0.29 11.802 0 10.162 0C6.732 0 4.492 2.08 4.492 5.85V9.16H0.671997V13.5H4.492V24H9.192V13.5H12.682Z" fill={color} />
            </g>
            <defs>
                <clipPath id="clip0_34_1384">
                    <rect width="13" height="24" fill={color} transform="translate(0.671997)" />
                </clipPath>
            </defs>
        </svg>
    );
}

Facebook.propTypes = {
    color: PropTypes.string
}


