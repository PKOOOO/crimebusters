import { createContext, useContext, useRef, useCallback, useMemo } from 'react';

const EmojiAnchorContext = createContext(null);

const NOOP_VALUE = {
    setAnchor: () => {},
    getAnchorRect: () => null,
};

export function EmojiAnchorProvider({ children }) {
    const anchorRef = useRef(null);

    const setAnchor = useCallback((el) => {
        anchorRef.current = el;
    }, []);

    const getAnchorRect = useCallback(() => (
        anchorRef.current?.getBoundingClientRect() ?? null
    ), []);

    const value = useMemo(() => ({ setAnchor, getAnchorRect }), [setAnchor, getAnchorRect]);

    return (
        <EmojiAnchorContext.Provider value={value}>
            {children}
        </EmojiAnchorContext.Provider>
    );
}

export function useEmojiAnchor() {
    return useContext(EmojiAnchorContext) ?? NOOP_VALUE;
}
