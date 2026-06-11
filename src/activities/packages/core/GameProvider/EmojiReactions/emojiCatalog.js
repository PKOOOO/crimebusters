// Catálogo de emojis disponibles para reacciones en partidas multijugador.
// Para añadir un nuevo emoji: agregar una entrada con id único y el componente SVG.
// El id también debe estar incluido en el allowlist del backend (model/matchDispatcher.php).
import { EmojiHeart } from './icons/EmojiHeart';
import { EmojiHandsUp } from './icons/EmojiHandsUp';
import { EmojiOk } from './icons/EmojiOk';
import { EmojiLaugh } from './icons/EmojiLaugh';
import { EmojiScare } from './icons/EmojiScare';
import { EmojiThinking } from './icons/EmojiThinking';

export const EMOJI_CATALOG = [
    { id: 'ok', Icon: EmojiOk },
    { id: 'handsUp', Icon: EmojiHandsUp },
    { id: 'heart', Icon: EmojiHeart },
    { id: 'thinking', Icon: EmojiThinking },
    { id: 'laugh', Icon: EmojiLaugh },
    { id: 'scare', Icon: EmojiScare },
];
