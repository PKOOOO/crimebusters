import PropTypes from 'prop-types'

/**
 * @param {string} className - classes that you want to put on the icon.
 * @param {string} color - color of the Icon.
 * @returns {React.ReactNode} - return a SoundOff (muted) Icon.
 */
export function SoundOff(props) {
    const { className, color = "currentColor" } = props;

    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="17" viewBox="0 0 22 17" fill="none" className={className}>
            <path fillRule="evenodd" clipRule="evenodd" d="M10.4332 0.168697C10.7797 0.335217 11 0.685595 11 1.07V15.07C11 15.4544 10.7797 15.8048 10.4332 15.9713C10.0867 16.1378 9.67548 16.091 9.37531 15.8509L4.64922 12.07H1C0.447715 12.07 0 11.6223 0 11.07V5.07C0 4.51772 0.447715 4.07 1 4.07H4.64922L9.37531 0.289131C9.67548 0.0489955 10.0867 0.00217707 10.4332 0.168697ZM9 3.15062L5.62469 5.85087C5.44738 5.99272 5.22707 6.07 5 6.07H2V10.07H5C5.22707 10.07 5.44738 10.1473 5.62469 10.2891L9 12.9894V3.15062Z" fill={color}/>
            <path fillRule="evenodd" clipRule="evenodd" d="M13.5429 4.61289C13.9334 4.22237 14.5666 4.22237 14.9571 4.61289L17.75 7.40578L20.5429 4.61289C20.9334 4.22237 21.5666 4.22237 21.9571 4.61289C22.3476 5.00342 22.3476 5.63658 21.9571 6.02711L19.1642 8.82L21.9571 11.6129C22.3476 12.0034 22.3476 12.6366 21.9571 13.0271C21.5666 13.4176 20.9334 13.4176 20.5429 13.0271L17.75 10.2342L14.9571 13.0271C14.5666 13.4176 13.9334 13.4176 13.5429 13.0271C13.1524 12.6366 13.1524 12.0034 13.5429 11.6129L16.3358 8.82L13.5429 6.02711C13.1524 5.63658 13.1524 5.00342 13.5429 4.61289Z" fill={color}/>
        </svg>
    );
}

SoundOff.propTypes = {
    className: PropTypes.string,
    color: PropTypes.string
}
