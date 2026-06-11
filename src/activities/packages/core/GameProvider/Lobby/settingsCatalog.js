// Catálogo de settings comunes a TODOS los juegos multijugador. Cada juego
// puede declarar los suyos propios (p.ej. `src/activities/games/TEST/src/multiplayerSettings.js`)
// y el componente LobbySettings fusionará ambos catálogos.
//
// Si un juego necesita ocultar un setting core concreto (p.ej. un juego sin
// respuestas múltiples donde `randomizeAnswers` no aplica), puede exportar
// también un array `disabledCoreSettings` con las keys a filtrar.
//
// El campo `label` contiene una clave de traducción (p.ej.
// `common.multiplayer.settings.randomizeQuestions`). Los juegos pueden usar
// claves específicas dentro de su propio `specific.*` o reutilizar las core.

export const CORE_SETTINGS_CATALOG = [
    {
        key: 'randomizeQuestions',
        label: 'common.multiplayer.settings.randomizeQuestions',
        type: 'toggle',
        default: true,
    },
    {
        key: 'randomizeAnswers',
        label: 'common.multiplayer.settings.randomizeAnswers',
        type: 'toggle',
        default: true,
    },
    {
        key: 'enableEmojis',
        label: 'common.multiplayer.settings.enableEmojis',
        type: 'toggle',
        default: true,
    },
    {
        key: 'autoplay',
        label: 'common.multiplayer.settings.autoplay',
        type: 'toggle',
        default: false,
    },
    {
        key: 'backgroundImage',
        label: 'common.multiplayer.settings.backgroundImage',
        type: 'image',
        default: '',
        // Paridad con el editor (premiumNeeded=1 para BACKGROUND): solo planes
        // de pago pueden cambiar el fondo. El gate se aplica en LobbySettings.
        premiumNeeded: 1,
    },
];

// Fusiona los catálogos core y específico del juego aplicando `disabledCoreSettings`.
// Si un juego define una clave con el mismo `key` que un core, el juego gana
// (permite sobrescribir label/default). Devuelve la lista final a renderizar.
export function mergeSettingsCatalog({ gameCatalog = [], disabledCoreSettings = [] } = {}) {
    const disabled = new Set(disabledCoreSettings);
    const byKey = new Map();
    for (const item of CORE_SETTINGS_CATALOG) {
        if (disabled.has(item.key)) continue;
        byKey.set(item.key, item);
    }
    for (const item of gameCatalog) {
        byKey.set(item.key, item);
    }
    return Array.from(byKey.values());
}

// Construye el objeto de settings por defecto a partir del catálogo ya fusionado
export function buildDefaultSettings(catalog) {
    const defaults = {};
    for (const item of catalog) {
        defaults[item.key] = item.default;
    }
    return defaults;
}
