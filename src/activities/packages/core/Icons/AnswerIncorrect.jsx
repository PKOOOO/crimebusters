import PropTypes from 'prop-types';

/**
 * @param {string} className - classes that you want to put on the icon.
 * @returns {React.ReactNode} - return the Answer Incorrect badge Icon.
 */
export function AnswerIncorrect(props) {
    const { className } = props;

    return (
        <svg width="68" height="68" viewBox="0 0 68 68" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
            <g filter="url(#filter0_d_answer_incorrect)">
                <path d="M2 32C2 14.3269 16.3269 0 34 0V0C51.6731 0 66 14.3269 66 32V32C66 49.6731 51.6731 64 34 64V64C16.3269 64 2 49.6731 2 32V32Z" fill="#F2CA0D" />
                <path d="M34 2C50.5685 2 64 15.4315 64 32C64 48.5685 50.5685 62 34 62C17.4315 62 4 48.5685 4 32C4 15.4315 17.4315 2 34 2Z" stroke="white" strokeWidth="4" />
                <path d="M45.1964 15.9957C46.5242 14.6682 48.6766 14.668 50.0043 15.9957C51.332 17.3234 51.3318 19.4758 50.0043 20.8036L38.808 31.9999L50.0043 43.1962C51.332 44.5239 51.3318 46.6763 50.0043 48.0041C48.6765 49.332 46.5242 49.332 45.1964 48.0041L34.0001 36.8078L22.8037 48.0041C21.4759 49.332 19.3236 49.332 17.9958 48.0041C16.6681 46.6763 16.668 44.524 17.9958 43.1962L29.1922 31.9999L17.9958 20.8036C16.6681 19.4758 16.668 17.3235 17.9958 15.9957C19.3236 14.6682 21.476 14.668 22.8037 15.9957L34.0001 27.192L45.1964 15.9957Z" fill="white" />
            </g>
            <defs>
                <filter id="filter0_d_answer_incorrect" x="0" y="0" width="68" height="68" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                    <feFlood floodOpacity="0" result="BackgroundImageFix" />
                    <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
                    <feOffset dy="2" />
                    <feGaussianBlur stdDeviation="1" />
                    <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.4 0" />
                    <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_answer_incorrect" />
                    <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_answer_incorrect" result="shape" />
                </filter>
            </defs>
        </svg>
    );
}

AnswerIncorrect.propTypes = {
    className: PropTypes.string,
};
