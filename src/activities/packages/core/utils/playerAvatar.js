// Paleta de colores agradables, evitando tonos muy claros para que el texto
// blanco mantenga buen contraste.
const AVATAR_COLORS = [
    '#6b9b37', '#2d8f8f', '#3a7bd5', '#7b4ebf', '#b53d8c',
    '#c0392b', '#d8762a', '#b58900', '#1f8a70', '#4e6cb8',
    '#8e4585', '#5d6d7e', '#16a085', '#cb4154', '#3d5a80',
];

function normalizeName(name) {
    return typeof name === 'string' ? name.trim() : '';
}

export function resolveAvatarSrc(...candidates) {
    for (const candidate of candidates) {
        if (typeof candidate === 'string' && candidate.trim()) {
            return candidate.trim();
        }
    }
    return null;
}

export function getInitials(name) {
    const normalized = normalizeName(name);
    if (!normalized) return '?';

    const words = normalized.split(/\s+/).filter(Boolean);

    if (words.length >= 2) {
        return (words[0][0] + words[words.length - 1][0]).toUpperCase();
    }

    const single = words[0];
    return single.length >= 2
        ? single.slice(0, 2).toUpperCase()
        : single[0].toUpperCase();
}

export function getAvatarColor(name) {
    const normalized = normalizeName(name) || '?';

    let hash = 0;
    for (let i = 0; i < normalized.length; i++) {
        hash = (hash * 31 + normalized.charCodeAt(i)) >>> 0;
    }

    return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}
