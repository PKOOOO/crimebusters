import PropTypes from 'prop-types'

/**
 * @param {string} className - classes that you want to put on the icon.
 * @param {string} color - color of the Icon.
 * @returns {React.ReactNode} - return an Exit Icon. 
 */
export function Exit(props) {
    const { className, color = "currentColor" } = props;

    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none" className={className}>
            <path fillRule="evenodd" clipRule="evenodd" d="M3 2C2.44772 2 2 2.44772 2 3V17C2 17.5523 2.44772 18 3 18H8C8.55228 18 9 18.4477 9 19C9 19.5523 8.55228 20 8 20H3C1.34315 20 0 18.6569 0 17V3C0 1.34315 1.34315 0 3 0H8C8.55228 0 9 0.447715 9 1C9 1.55228 8.55228 2 8 2H3Z" fill={color} />
            <path d="M15.7071 5.29289C15.3166 4.90237 14.6834 4.90237 14.2929 5.29289C13.9024 5.68342 13.9024 6.31658 14.2929 6.70711L16.5858 9H7C6.44772 9 6 9.44772 6 10C6 10.5523 6.44772 11 7 11H16.5858L14.2929 13.2929C13.9024 13.6834 13.9024 14.3166 14.2929 14.7071C14.6834 15.0976 15.3166 15.0976 15.7071 14.7071L19.7065 10.7077C19.7087 10.7056 19.7114 10.7027 19.7136 10.7005C19.9038 10.5069 19.9992 10.2551 20 10.003" fill={color} />
            <path d="M19.7136 9.29945C19.8063 9.3938 19.8764 9.50195 19.9241 9.61722C19.8746 9.49788 19.8027 9.39021 19.7136 9.29945Z" fill={color} />
            <path d="M15.7071 5.29289L19.7065 9.29226L15.7071 5.29289Z" fill={color} />
        </svg>
    );
}

Exit.propTypes = {
    className: PropTypes.string,
    color: PropTypes.string
}

