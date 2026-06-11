export function AnimationHeart(props) {

    const { color = "currentColor", className } = props;

    return (
        <svg className={className} width="72" height="63" viewBox="0 0 72 63" fill="none" xmlns="http://www.w3.org/2000/svg">
            <g filter="url(#filter0_i_240_2043)">
                <path fillRule="evenodd" clipRule="evenodd" d="M66.4481 5.56966C62.8951 2.00356 58.0751 0 53.0492 0C48.0232 0 43.2033 2.00356 39.6502 5.56966L35.9991 9.23248L32.3479 5.56966C24.9479 -1.85409 12.9501 -1.85409 5.55003 5.56966C-1.85001 12.9934 -1.85001 25.0297 5.55003 32.4534L9.20116 36.1162L35.9991 63L62.797 36.1162L66.4481 32.4534C70.0028 28.889 72 24.0536 72 19.0115C72 13.9695 70.0028 9.13409 66.4481 5.56966Z" fill={color} fillOpacity="0.7" />
            </g>
            <defs>
                <filter id="filter0_i_240_2043" x="0" y="0" width="72" height="63" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                    <feFlood floodOpacity="0" result="BackgroundImageFix" />
                    <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
                    <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
                    <feOffset dy="4" />
                    <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
                    <feColorMatrix type="matrix" values="0 0 0 0 0.0666667 0 0 0 0 0.12549 0 0 0 0 0 0 0 0 0.2 0" />
                    <feBlend mode="normal" in2="shape" result="effect1_innerShadow_240_2043" />
                </filter>
            </defs>
        </svg>
    );
}