import { useState, useCallback, useRef, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useEvent } from '../../hooks/useEvent';
import { useGameSounds } from '../../hooks';
import { NAME_SOUND_MOVE } from '../../utils';
import { EMOJI_CATALOG } from './emojiCatalog';
import { useEmojiAnchor } from './EmojiAnchorContext';

let nextId = 0;

const EMOJI_MAP = Object.fromEntries(
    EMOJI_CATALOG.map(({ id, Icon }) => [id, Icon])
);

export function useEmojiOverlay() {
    const [emojis, setEmojis] = useState([]);
    const { getAnchorRect } = useEmojiAnchor();
    const gameSounds = useGameSounds();
    // Durante la rehidratación todos los emojis del backlog llegan en ráfaga.
    // No queremos pintarlos: ya pertenecen al pasado y reproducirlos al hacer
    // F5 satura la pantalla. Leemos el flag desde el store y dejamos que el
    // ref capture el valor más reciente sin re-crear el callback (que tiraría
    // el subscriber de useEvent).
    const rehydrating = useSelector(state => state.multiplayer.rehydrating);
    const rehydratingRef = useRef(rehydrating);
    useEffect(() => { rehydratingRef.current = rehydrating; }, [rehydrating]);
    // Guardamos los IDs de los setTimeout pendientes para poder cancelarlos al
    // desmontar — si no, en partidas con muchos emojis se acumulan timers que
    // disparan setState después del unmount (warnings + CPU desperdiciada)
    const pendingTimeoutsRef = useRef(new Map());

    const handleEmoji = useCallback((message) => {
        if (rehydratingRef.current) return;
        const Icon = EMOJI_MAP[message.emojiId];
        if (!Icon) return;

        const rect = getAnchorRect();
        // Fallback para el host (sin EmojiPicker): esquina inferior derecha,
        // emulando la posición que ocupa el picker en el footer del jugador.
        const origin = rect
            ? { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
            : { x: window.innerWidth - 32, y: window.innerHeight - 32 };

        const id = nextId++;
        setEmojis(prev => [...prev, { id, Icon, origin }]);
        gameSounds.play(NAME_SOUND_MOVE);

        const timeoutId = setTimeout(() => {
            pendingTimeoutsRef.current.delete(id);
            setEmojis(prev => prev.filter(e => e.id !== id));
        }, 2200);
        pendingTimeoutsRef.current.set(id, timeoutId);
    }, [getAnchorRect, gameSounds]);

    useEvent('emoji', handleEmoji);

    useEffect(() => {
        const pending = pendingTimeoutsRef.current;
        return () => {
            for (const timeoutId of pending.values()) {
                clearTimeout(timeoutId);
            }
            pending.clear();
        };
    }, []);

    return emojis;
}
