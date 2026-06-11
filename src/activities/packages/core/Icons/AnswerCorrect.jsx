import PropTypes from 'prop-types';

/**
 * @param {string} className - classes that you want to put on the icon.
 * @returns {React.ReactNode} - return the Answer Correct badge Icon.
 */
export function AnswerCorrect(props) {
    const { className } = props;

    return (
        <svg width="68" height="68" viewBox="0 0 68 68" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
            <g filter="url(#filter0_d_answer_correct)">
                <path d="M2 32C2 14.3269 16.3269 0 34 0V0C51.6731 0 66 14.3269 66 32V32C66 49.6731 51.6731 64 34 64V64C16.3269 64 2 49.6731 2 32V32Z" fill="#559107" />
                <path d="M34 2C50.5685 2 64 15.4315 64 32C64 48.5685 50.5685 62 34 62C17.4315 62 4 48.5685 4 32C4 15.4315 17.4315 2 34 2Z" stroke="white" strokeWidth="4" />
                <path d="M49.9914 18.4438C51.3661 17.1854 53.5943 17.1854 54.969 18.4438C56.3437 19.7022 56.3437 21.7419 54.969 23.0003L30.3287 45.5562C28.954 46.8146 26.7258 46.8146 25.3511 45.5562L13.031 34.2783C11.6563 33.0199 11.6563 30.9801 13.031 29.7218C14.4057 28.4634 16.6339 28.4634 18.0086 29.7218L27.8399 38.7215L49.9914 18.4438Z" fill="white" />
            </g>
            <defs>
                <filter id="filter0_d_answer_correct" x="0" y="0" width="68" height="68" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                    <feFlood floodOpacity="0" result="BackgroundImageFix" />
                    <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
                    <feOffset dy="2" />
                    <feGaussianBlur stdDeviation="1" />
                    <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.4 0" />
                    <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_answer_correct" />
                    <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_answer_correct" result="shape" />
                </filter>
            </defs>
        </svg>
    );
}

AnswerCorrect.propTypes = {
    className: PropTypes.string,
};
