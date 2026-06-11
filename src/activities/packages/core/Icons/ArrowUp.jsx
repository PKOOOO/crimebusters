import PropTypes from 'prop-types'

/**
 * @param {string} className - classes that you want to put on the icon.
 * @param {string} color - color with which you want to paint the icon.
 * @returns {React.ReactNode} - return an ArrowUp Icon.
 */
export function ArrowUp(props) {
    const { className, color = 'currentColor' } = props;

    return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className={className}>
            <path d="M8 2L14 9H10V14H6V9H2L8 2Z" fill={color} />
        </svg>
    );
}

ArrowUp.propTypes = {
    className: PropTypes.string,
    color: PropTypes.string
}
