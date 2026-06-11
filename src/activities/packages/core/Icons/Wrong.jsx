import PropTypes from 'prop-types'

/**
 * @param {string} className - classes that you want to put on the icon.
 * @param {string} color - classes that you want to put on the icon.
 * @returns {React.ReactNode} - return an Exit Icon. 
 */
export function Wrong(props) {
    const { className, color = "currentColor" } = props;

    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18" fill="none" className={className}>
            <path fillRule="evenodd" clipRule="evenodd" d="M17.2591 0.792893C17.6496 1.18342 17.6496 1.81658 17.2591 2.20711L2.25911 17.2071C1.86858 17.5976 1.23542 17.5976 0.844895 17.2071C0.454371 16.8166 0.454371 16.1834 0.844895 15.7929L15.8449 0.792893C16.2354 0.402369 16.8686 0.402369 17.2591 0.792893Z" fill={color} />
            <path fillRule="evenodd" clipRule="evenodd" d="M0.844895 0.792893C1.23542 0.402369 1.86858 0.402369 2.25911 0.792893L17.2591 15.7929C17.6496 16.1834 17.6496 16.8166 17.2591 17.2071C16.8686 17.5976 16.2354 17.5976 15.8449 17.2071L0.844895 2.20711C0.454371 1.81658 0.454371 1.18342 0.844895 0.792893Z" fill={color}  />
        </svg>
    );
}

Wrong.propTypes = {
    className: PropTypes.string,
    color: PropTypes.string
}