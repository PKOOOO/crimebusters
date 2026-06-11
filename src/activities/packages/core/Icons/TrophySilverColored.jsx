import PropTypes from 'prop-types';

/**
 * @param {string} className - classes that you want to put on the icon.
 * @param {number|string} size - width and height for the icon (default 30).
 * @returns {React.ReactNode} - return a colored silver trophy/medal Icon.
 */
export function TrophySilverColored(props) {
    const { className, size = 30 } = props;

    return (
        <svg className={className} width={size} height={size} viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" clipRule="evenodd" d="M15.5 18.5C16.6046 18.5 17.5 19.3954 17.5 20.5C17.5 21.6046 16.6046 22.5 15.5 22.5C14.3954 22.5 13.5 21.6046 13.5 20.5C13.5 19.3954 14.3954 18.5 15.5 18.5ZM15.5 19.5C14.9477 19.5 14.5 19.9477 14.5 20.5C14.5 21.0523 14.9477 21.5 15.5 21.5C16.0523 21.5 16.5 21.0523 16.5 20.5C16.5 19.9477 16.0523 19.5 15.5 19.5Z" fill="#999999" />
            <path fillRule="evenodd" clipRule="evenodd" d="M15.5 15C18.5376 15 21 17.4624 21 20.5C21 23.5376 18.5376 26 15.5 26C12.4624 26 10 23.5376 10 20.5C10 17.4624 12.4624 15 15.5 15ZM15.5 17C13.567 17 12 18.567 12 20.5C12 22.433 13.567 24 15.5 24C17.433 24 19 22.433 19 20.5C19 18.567 17.433 17 15.5 17Z" fill="#999999" />
            <path fillRule="evenodd" clipRule="evenodd" d="M15.5 5C16.8807 5 18 6.11929 18 7.5V11.5C18 12.8807 16.8807 14 15.5 14C14.1193 14 13 12.8807 13 11.5V7.5C13 6.11929 14.1193 5 15.5 5ZM15.5 7C15.2239 7 15 7.22386 15 7.5V11.5C15 11.7761 15.2239 12 15.5 12C15.7761 12 16 11.7761 16 11.5V7.5C16 7.22386 15.7761 7 15.5 7Z" fill="#999999" />
            <path fillRule="evenodd" clipRule="evenodd" d="M9.5 5C10.8807 5 12 6.11929 12 7.5V9.5C12 10.8807 10.8807 12 9.5 12C8.11929 12 7 10.8807 7 9.5V7.5C7 6.11929 8.11929 5 9.5 5ZM9.5 7C9.22386 7 9 7.22386 9 7.5V9.5C9 9.77614 9.22386 10 9.5 10C9.77614 10 10 9.77614 10 9.5V7.5C10 7.22386 9.77614 7 9.5 7Z" fill="#999999" />
            <path fillRule="evenodd" clipRule="evenodd" d="M21.5 5C22.8807 5 24 6.11929 24 7.5V9.5C24 10.8807 22.8807 12 21.5 12C20.1193 12 19 10.8807 19 9.5V7.5C19 6.11929 20.1193 5 21.5 5ZM21.5 7C21.2239 7 21 7.22386 21 7.5V9.5C21 9.77614 21.2239 10 21.5 10C21.7761 10 22 9.77614 22 9.5V7.5C22 7.22386 21.7761 7 21.5 7Z" fill="#999999" />
        </svg>
    );
}

TrophySilverColored.propTypes = {
    className: PropTypes.string,
    size: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
};
