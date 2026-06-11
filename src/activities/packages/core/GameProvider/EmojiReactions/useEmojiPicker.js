import { useState, useCallback, useRef, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { sendEmoji } from '@educaplay/core/services/multiplayer';

const COOLDOWN_MS = 2000;

export function useEmojiPicker(containerRef) {
    const match = useSelector(state => state.multiplayer.match);
    const user = useSelector(state => state.game.user);
    const [open, setOpen] = useState(false);
    const cooldownRef = useRef(false);

    useEffect(() => {
        if (!open) return;
        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener('pointerdown', handleClickOutside);
        return () => document.removeEventListener('pointerdown', handleClickOutside);
    }, [open, containerRef]);

    const toggle = useCallback(() => {
        setOpen(prev => !prev);
    }, []);

    const select = useCallback(async (emojiId) => {
        if (cooldownRef.current || !match?.id || !user?.token) return;

        cooldownRef.current = true;
        setOpen(false);

        try {
            await sendEmoji(emojiId);
        } catch (e) {
            console.error('Error sending emoji:', e);
        }

        setTimeout(() => { cooldownRef.current = false; }, COOLDOWN_MS);
    }, [match?.id, user?.token]);

    return { open, toggle, select };
}
