import PropTypes from 'prop-types'

/**
 * @param {string} className - classes that you want to put on the Rounded Edge.
 * @param {string} color - color of the Rounded Edge.
 * @returns {React.ReactNode} - return a Rounded Edge. 
 */
export function GameProviderMainMenuRoundedEdge(props){
    const { className, color ="currentColor" } = props;

    return(
        <svg width="1152" height="52" viewBox="0 0 1152 52" fill="none" className={className}>
            <path fill={color} d="M25.4294 0.945846L1127.43 20.2635C1140.79 20.4978 1151.5 31.3962 1151.5 44.7598V51.5H0.5V25.4421C0.5 11.7431 11.7325 0.705744 25.4294 0.945846Z" stroke="url(#paint0_linear_54_3)"></path>
            <defs>
            <linearGradient id="paint0_linear_54_3" x1="576.5" y1="10.0971" x2="575.99" y2="53.0096" gradientUnits="userSpaceOnUse">
            <stop offset="0.0192308" stopColor="#FFFFFF" stopOpacity="0.8"></stop>
            <stop offset="0.166667" stopColor="#FFFFFF" stopOpacity="0.4"></stop>
            <stop offset="0.499607" stopColor="#FFFFFF" stopOpacity="0"></stop>
            </linearGradient>
            </defs>
        </svg>
    );
}

GameProviderMainMenuRoundedEdge.propTypes = {
    className: PropTypes.string,
    color: PropTypes.string
}