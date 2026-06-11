import PropTypes from 'prop-types'

/**
 * @param {string} className - classes that you want to put on the icon.
 * @param {string} color - color that you want to put on the Icon.
 * @returns {React.ReactNode} - return an Check Icon. 
 */
export function Check(props) {
    const { className, color = "currentColor" } = props;

    return (
        <svg width="23" height="16" viewBox="0 0 23 16" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
            <path fillRule="evenodd" clipRule="evenodd" d="M22.2071 0.417893C22.5976 0.808417 22.5976 1.44158 22.2071 1.83211L8.45711 15.5821C8.06658 15.9726 7.43342 15.9726 7.04289 15.5821L0.792893 9.33211C0.402369 8.94158 0.402369 8.30842 0.792893 7.91789C1.18342 7.52737 1.81658 7.52737 2.20711 7.91789L7.75 13.4608L20.7929 0.417893C21.1834 0.0273689 21.8166 0.0273689 22.2071 0.417893Z" fill={color} />
        </svg>

    );
}

Check.propTypes = {
    className: PropTypes.string,
    color: PropTypes.string
}