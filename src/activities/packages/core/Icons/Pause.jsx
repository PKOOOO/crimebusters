import PropTypes from 'prop-types'

/**
 * @param {string} className - classes that you want to put on the icon.
 * @param {string} color - color with which you want to paint the icon.
 * @returns {React.ReactNode} - return an Pause Icon. 
 */
export function Pause(props) {
    const { className, color = 'currentColor' } = props;

    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 15 15" fill="none" className={className}>
            <path fillRule="evenodd" clipRule="evenodd" d="M1.86487 0.722549C1.31258 0.722549 0.864868 1.17027 0.864868 1.72255V13.7225C0.864868 14.2748 1.31258 14.7225 1.86487 14.7225H5.46487C6.01715 14.7225 6.46487 14.2748 6.46487 13.7225V1.72255C6.46487 1.17026 6.01715 0.722549 5.46487 0.722549H1.86487ZM10.2645 0.722549C9.71224 0.722549 9.26453 1.17027 9.26453 1.72255V13.7225C9.26453 14.2748 9.71224 14.7225 10.2645 14.7225H13.8645C14.4168 14.7225 14.8645 14.2748 14.8645 13.7225V1.72255C14.8645 1.17026 14.4168 0.722549 13.8645 0.722549H10.2645Z" fill={color} />
        </svg>
    );
}

Pause.propTypes = {
    className: PropTypes.string,
    color: PropTypes.string
}