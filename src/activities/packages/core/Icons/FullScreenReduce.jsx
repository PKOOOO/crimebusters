import PropTypes from 'prop-types'

/**
 * @param {string} className - classes that you want to put on the icon.
 * @returns {React.ReactNode} - return an Fullscreen Icon. 
 */
export function FullScreenReduce(props) {
    const { className, color = "currentColor" } = props;

    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none" className={className}>
            <path fillRule="evenodd" clipRule="evenodd" d="M6 0C6.55228 0 7 0.447715 7 1V4C7 5.65685 5.65685 7 4 7H1C0.447715 7 0 6.55228 0 6C0 5.44772 0.447715 5 1 5H4C4.55228 5 5 4.55228 5 4V1C5 0.447715 5.44772 0 6 0ZM14 0C14.5523 0 15 0.447715 15 1V4C15 4.55228 15.4477 5 16 5H19C19.5523 5 20 5.44772 20 6C20 6.55228 19.5523 7 19 7H16C14.3431 7 13 5.65685 13 4V1C13 0.447715 13.4477 0 14 0ZM0 14C0 13.4477 0.447715 13 1 13H4C5.65685 13 7 14.3431 7 16V19C7 19.5523 6.55228 20 6 20C5.44772 20 5 19.5523 5 19V16C5 15.4477 4.55228 15 4 15H1C0.447715 15 0 14.5523 0 14ZM16 15C15.4477 15 15 15.4477 15 16V19C15 19.5523 14.5523 20 14 20C13.4477 20 13 19.5523 13 19V16C13 14.3431 14.3431 13 16 13H19C19.5523 13 20 13.4477 20 14C20 14.5523 19.5523 15 19 15H16Z" fill={color} />
        </svg>
    );
}

FullScreenReduce.propTypes = {
    className: PropTypes.string,
    color: PropTypes.string
}

