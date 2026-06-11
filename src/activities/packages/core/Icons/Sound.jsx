import PropTypes from 'prop-types'

/**
 * @param {string} className - classes that you want to put on the icon.
 * @param {string} color - color of the Icon.
 * @returns {React.ReactNode} - return an Exit Icon. 
 */
export function Sound(props) {
    const { className, color = "currentColor" } = props;

    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="17" viewBox="0 0 22 17" fill="none" className={className}>
            <path fillRule="evenodd" clipRule="evenodd" d="M10.4332 0.168697C10.7797 0.335217 11 0.685595 11 1.07V15.07C11 15.4544 10.7797 15.8048 10.4332 15.9713C10.0867 16.1378 9.67548 16.091 9.37531 15.8509L4.64922 12.07H1C0.447715 12.07 0 11.6223 0 11.07V5.07C0 4.51772 0.447715 4.07 1 4.07H4.64922L9.37531 0.289131C9.67548 0.0489955 10.0867 0.00217707 10.4332 0.168697ZM9 3.15062L5.62469 5.85087C5.44738 5.99272 5.22707 6.07 5 6.07H2V10.07H5C5.22707 10.07 5.44738 10.1473 5.62469 10.2891L9 12.9894V3.15062Z" fill={color}/>
            <path fillRule="evenodd" clipRule="evenodd" d="M17.363 0.292786C17.7536 -0.0976789 18.3867 -0.0975833 18.7772 0.293C23.0714 4.5885 23.0714 11.5515 18.7772 15.847C18.3867 16.2376 17.7536 16.2377 17.363 15.8472C16.9724 15.4567 16.9723 14.8236 17.3628 14.433C20.8762 10.9185 20.8762 5.2215 17.3628 1.707C16.9723 1.31642 16.9724 0.683252 17.363 0.292786Z" fill={color} />
            <path fillRule="evenodd" clipRule="evenodd" d="M13.833 3.82279C14.2236 3.43232 14.8567 3.43242 15.2472 3.823C17.5895 6.166 17.5895 9.964 15.2472 12.307C14.8567 12.6976 14.2236 12.6977 13.833 12.3072C13.4424 11.9167 13.4423 11.2836 13.8328 10.893C15.3943 9.331 15.3943 6.799 13.8328 5.237C13.4423 4.84642 13.4424 4.21325 13.833 3.82279Z" fill={color} />
        </svg>
    );
}

Sound.propTypes = {
    className: PropTypes.string,
    color: PropTypes.string
}