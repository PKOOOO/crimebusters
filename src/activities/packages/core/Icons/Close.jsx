import PropTypes from 'prop-types'

/**
 * @param {string} className - classes that you want to put on the icon.
 * @param {string} color - color of the Icon.
 * @param {number} size - size of the Icon.
 * @returns {React.ReactNode} - return an Close Icon. 
 */
export function Close(props) {
    const { className, size = 24, color = "currentColor" } = props;

    return (
        <svg width={size} height={size} className={className} viewBox="0 0 24 24" fill="none">
            <path fillRule="evenodd" clipRule="evenodd" d="M1.69173 1.14033C1.89037 0.948506 2.20691 0.954031 2.39873 1.15267L12.0391 11.1355L21.6794 1.15267C21.8712 0.954031 22.1878 0.948506 22.3864 1.14033C22.5851 1.33216 22.5906 1.64869 22.3988 1.84733L12.7342 11.8553L22.3988 21.8633C22.5906 22.0619 22.5851 22.3784 22.3864 22.5703C22.1878 22.7621 21.8712 22.7566 21.6794 22.5579L12.0391 12.5751L2.39873 22.5579C2.20691 22.7566 1.89037 22.7621 1.69173 22.5703C1.49309 22.3784 1.48757 22.0619 1.67939 21.8633L11.344 11.8553L1.67939 1.84733C1.48757 1.64869 1.49309 1.33216 1.69173 1.14033Z" fill={color}/>
        </svg>
    );
}

Close.propTypes = {
    className: PropTypes.string,
    color: PropTypes.string,
    size: PropTypes.number
}

