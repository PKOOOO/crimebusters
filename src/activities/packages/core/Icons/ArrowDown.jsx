import PropTypes from 'prop-types'

/**
 * @param {string} className - classes that you want to put on the icon.
 * @param {string} color - color with which you want to paint the icon.
 * @returns {React.ReactNode} - return an ArrowDown Icon.
 */
export function ArrowDown(props) {
    const { className, color = 'currentColor' } = props;

    return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className={className}>
            <path d="M8 14L2 7H6V2H10V7H14L8 14Z" fill={color} />
        </svg>
    );
}

ArrowDown.propTypes = {
    className: PropTypes.string,
    color: PropTypes.string
}
