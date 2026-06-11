import PropTypes from 'prop-types'

/**
 * @param {string} className - classes that you want to put on the icon.
 * @param {string} color - color with which you want to paint the icon.
 * @returns {React.ReactNode} - return an FilledPlay Icon. 
 */
export function FilledPlay(props) {
    const { className, color = 'currentColor' } = props;

    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="14" viewBox="0 0 12 14" fill="none" className={className}>
  <path fillRule="evenodd" clipRule="evenodd" d="M0.903442 1.05421C0.903442 0.263049 1.77869 -0.214793 2.4442 0.213036L11.2616 5.88137C11.8739 6.27501 11.8739 7.17009 11.2616 7.56373L2.4442 13.2321C1.77869 13.6599 0.903442 13.182 0.903442 12.3909V1.05421Z" fill={color}/>
</svg>
    );
}

FilledPlay.propTypes = {
    className: PropTypes.string,
    color: PropTypes.string
}