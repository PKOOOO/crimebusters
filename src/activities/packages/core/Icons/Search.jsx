import PropTypes from 'prop-types'

/**
 * @param {string} className - classes that you want to put on the icon.
 * @param {string} color - color with which you want to paint the icon.
 * @returns {React.ReactNode} - return an Search Icon. 
 */
export function Search(props) {
    const { className, color = 'currentColor' } = props;

    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="23" height="23" viewBox="0 0 23 23" fill="none" className={className}>
            <path fillRule="evenodd" clipRule="evenodd" d="M10.0173 0.722549C4.85338 0.722549 0.667236 4.90869 0.667236 10.0726C0.667236 15.2364 4.85338 19.4226 10.0173 19.4226C12.2033 19.4226 14.2141 18.6724 15.8063 17.4154L20.7913 22.4004C21.2209 22.8299 21.9174 22.8299 22.347 22.4004C22.7765 21.9708 22.7765 21.2743 22.347 20.8447L17.3617 15.8595C18.6177 14.2676 19.3673 12.2576 19.3673 10.0726C19.3673 4.90869 15.1811 0.722549 10.0173 0.722549ZM15.1345 15.0663C16.3922 13.7776 17.1673 12.0156 17.1673 10.0726C17.1673 6.12372 13.9661 2.92255 10.0173 2.92255C6.06841 2.92255 2.86724 6.12372 2.86724 10.0726C2.86724 14.0214 6.06841 17.2226 10.0173 17.2226C11.9611 17.2226 13.7238 16.4469 15.0126 15.1881C15.0312 15.1664 15.0508 15.1453 15.0713 15.1247C15.0918 15.1043 15.1128 15.0848 15.1345 15.0663Z" fill={color} />
        </svg>
    );
}

Search.propTypes = {
    className: PropTypes.string,
    color: PropTypes.string
}