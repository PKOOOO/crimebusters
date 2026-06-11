import PropTypes from 'prop-types'

/**
 * @param {string} color - color of the Icon
 * @param {string} className - classes that you want to put on the icon.
 * @returns {React.ReactNode} - return a Report Icon.
 */

export function Report(props) {

    const { color = "currentColor", className } = props;

    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 30 30" fill="none" className={className}>
            <path fillRule="evenodd" clipRule="evenodd" d="M17 6C18.1046 6 19 6.89543 19 8H19.5C20.9147 8 22 9.17886 22 10.5557V21.4443C22 22.8211 20.9147 24 19.5 24H10.5C9.08532 24 8 22.8211 8 21.4443V10.5557C8 9.17886 9.08532 8 10.5 8H11C11 6.89543 11.8954 6 13 6H17ZM10.5 10C10.2578 10 10 10.2142 10 10.5557V21.4443C10 21.7858 10.2578 22 10.5 22H19.5C19.7422 22 20 21.7858 20 21.4443V10.5557C20 10.2142 19.7422 10 19.5 10H18.7305C18.3845 10.5973 17.7399 11 17 11H13C12.2601 11 11.6155 10.5973 11.2695 10H10.5ZM13 9H17V8H13V9Z" fill={color}/>
        </svg>
    )
}

Report.propTypes = {
    color: PropTypes.string,
    className: PropTypes.string
}
