import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslate } from '@educaplay/core/hooks';
import { EMOJI_CATALOG } from './emojiCatalog';
import { EmojiReaction } from './icons/EmojiReaction';
import { useEmojiPicker } from './useEmojiPicker';
import { useEmojiAnchor } from './EmojiAnchorContext';
import styles from './EmojiPicker.module.scss';

export function EmojiPicker({ buttonClassName }) {
    const t = useTranslate();
    const containerRef = useRef(null);
    const triggerRef = useRef(null);
    const { setAnchor } = useEmojiAnchor();
    const { open, toggle, select } = useEmojiPicker(containerRef);

    useEffect(() => {
        setAnchor(triggerRef.current);
        return () => setAnchor(null);
    }, [setAnchor]);
    // enableEmojis por defecto true (si el setting aún no llegó del backend).
    // El servidor también valida: si el host lo deshabilita tras cargar el
    // lobby, action_sendEmoji rechazará los envíos aunque algún cliente
    // tuviese una versión cacheada
    const enableEmojis = useSelector(state => state.multiplayer.settings?.enableEmojis ?? true);

    if (!enableEmojis) return null;

    return (
        <div className={styles.container} ref={containerRef}>
            <AnimatePresence>
                {open && (
                    <motion.div
                        className={styles.menu}
                        initial={{ opacity: 0, scale: 0.8, y: 8 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: 8 }}
                        transition={{ duration: 0.15 }}
                    >
                        {EMOJI_CATALOG.map(({ id, Icon }) => (
                            <button
                                key={id}
                                className={styles.emojiButton}
                                onClick={() => select(id)}
                            >
                                <Icon size={48} />
                            </button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            <button
                ref={triggerRef}
                className={buttonClassName}
                onClick={toggle}
                aria-label={t('common.multiplayer.emoji.sendAria')}
            >
                <EmojiReaction />
            </button>
        </div>
    );
}
