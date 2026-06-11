export function EmojiReaction({ className, color = 'currentColor' }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" className={className}>
            <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2"/>
            <circle cx="8.5" cy="10" r="1.5" fill={color}/>
            <circle cx="15.5" cy="10" r="1.5" fill={color}/>
            <path d="M8 15c1.333 1.333 2.667 2 4 2s2.667-.667 4-2" stroke={color} strokeWidth="2" strokeLinecap="round"/>
        </svg>
    );
}
