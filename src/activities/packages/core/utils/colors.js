// Eliminada la dependencia de Values.js - implementación nativa

/**
 * Convierte un color hex a RGB
 * @param {string} hex - Color en formato hex (#RRGGBB)
 * @returns {object} Objeto con r, g, b
 */
function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

/**
 * Convierte RGB a hex
 * @param {number} r - Rojo (0-255)
 * @param {number} g - Verde (0-255)
 * @param {number} b - Azul (0-255)
 * @returns {string} Color en formato hex
 */
function rgbToHex(r, g, b) {
    const toHex = (n) => {
        const hex = Math.round(n).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    };
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Convierte RGB a HSL
 * @param {number} r - Rojo (0-255)
 * @param {number} g - Verde (0-255)
 * @param {number} b - Azul (0-255)
 * @returns {object} Objeto con h, s, l
 */
function rgbToHsl(r, g, b) {
    r /= 255;
    g /= 255;
    b /= 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
        h = s = 0;
    } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }

    return { h: h * 360, s: s * 100, l: l * 100 };
}

/**
 * Convierte HSL a RGB
 * @param {number} h - Matiz (0-360)
 * @param {number} s - Saturación (0-100)
 * @param {number} l - Luminosidad (0-100)
 * @returns {object} Objeto con r, g, b
 */
function hslToRgb(h, s, l) {
    h /= 360;
    s /= 100;
    l /= 100;

    const hue2rgb = (p, q, t) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
    };

    let r, g, b;

    if (s === 0) {
        r = g = b = l;
    } else {
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hue2rgb(p, q, h + 1 / 3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1 / 3);
    }

    return {
        r: Math.round(r * 255),
        g: Math.round(g * 255),
        b: Math.round(b * 255)
    };
}

export function normalizeColor(color) {
    if (!color) return null
    if (color.startsWith('0x')) {
        return `#${color.replace('0x', '')}`
    }
    return color
}

export function getColorShades(color) {
    const baseRgb = hexToRgb(color);
    if (!baseRgb) return [];

    const totalShades = 15;
    const allShades = [];

    for (let i = 0; i < totalShades; i++) {
        const percentage = (i / (totalShades - 1)) * 100; // 0% a 100%

        const hsl = rgbToHsl(baseRgb.r, baseRgb.g, baseRgb.b);

        let newL;
        if (percentage <= 50) {
            const factor = percentage / 50;
            newL = 100 - (100 - hsl.l) * factor;
        } else {
            const factor = (percentage - 50) / 50;
            newL = hsl.l * (1 - factor);
        }

        const newRgb = hslToRgb(hsl.h, hsl.s, Math.max(0, Math.min(100, newL)));
        const newHex = rgbToHex(newRgb.r, newRgb.g, newRgb.b);

        allShades.push({
            hexString: () => newHex,
            rgb: [newRgb.r, newRgb.g, newRgb.b]
        });
    }
    return allShades;
}

export function getRgb(color) {
    const rgb = hexToRgb(color);
    if (!rgb) return '0,0,0';
    return `${rgb.r},${rgb.g},${rgb.b}`;
}

export const DEFAULT_MAIN_COLOR = '#67A516';

export function CUSTOM_COLORS(data) {
    return {
        primaryColor: data.COLOR_FONDO,
        primaryTextColor: data.COLOR_FUENTE,
        secondaryColor: data.SECONDARY_COLOR,
        secondaryTextColor: data.SECONDARY_TEXT_COLOR,
        progressColor: data.PROGRESS_COLOR,
        tertiaryColor: data.TERTIARY_COLOR,
        iconGameColor: data.ICON_GAME_COLOR,
        buttonInterfaceColor: data.COLOR_BOTONES,
        buttonInterfaceTextColor: data.COLOR_FUENTE_B,
        buttonInterfaceHoverColor: data.COLOR_BOTONES_HOVER,
        buttonInterfaceHoverTextColor: data.COLOR_FUENTE_B_HOVER,
        buttonInterfaceActiveColor: data.COLOR_BOTONES_ACTIVE,
        buttonInterfaceActiveTextColor: data.COLOR_FUENTE_B_ACTIVE,
        buttonSecondaryInterfaceColor: data.INTERFACE_BUTTON_COLOR,
        buttonSecondaryInterfaceTextColor: data.INTERFACE_BUTTON_TEXT_COLOR,
        buttonSecondaryInterfaceHoverColor: data.INTERFACE_BUTTON_HOVER_COLOR,
        buttonSecondaryInterfaceHoverTextColor: data.INTERFACE_BUTTON_HOVER_TEXT_COLOR,
        buttonSecondaryInterfaceActiveColor: data.INTERFACE_BUTTON_ACTIVE_COLOR,
        buttonSecondaryInterfaceActiveTextColor: data.INTERFACE_BUTTON_ACTIVE_TEXT_COLOR,
        buttonGameColor: data.GAME_BUTTON_COLOR,
        buttonGameTextColor: data.GAME_BUTTON_TEXT_COLOR,
        buttonGameHoverColor: data.GAME_BUTTON_HOVER_COLOR,
        buttonGameHoverTextColor: data.GAME_BUTTON_HOVER_TEXT_COLOR,
        buttonGameActiveColor: data.GAME_BUTTON_ACTIVE_COLOR,
        buttonGameActiveTextColor: data.GAME_BUTTON_ACTIVE_TEXT_COLOR,
        buttonBorderColor: data.GAME_BUTTON_BORDER_COLOR,
        buttonHoverBorderColor: data.GAME_BUTTON_HOVER_BORDER_COLOR,
        gradientBackgroundColor: data.GRADIENT_BACKGROUND_COLOR,
        titleTextColor: data.TITLE_TEXT_COLOR,
        typeTextColor: data.TYPE_TEXT_COLOR,
        accentColor: data.ACCENT_COLOR,
        accentTextColor: data.ACCENT_TEXT_COLOR,
        accentHoverColor: data.ACCENT_HOVER_COLOR,
        accentHoverTextColor: data.ACCENT_HOVER_TEXT_COLOR,
        accentBorderColor: data.ACCENT_BORDER_COLOR,
        successColor: data.SUCCESS_COLOR,
        successTextColor: data.SUCCESS_TEXT_COLOR,
        errorColor: data.ERROR_COLOR,
        errorTextColor: data.ERROR_TEXT_COLOR,
        elementBackgroundColor: data.ELEMENT_BACKGROUND_COLOR,
        elementBorderColor: data.ELEMENT_BORDER_COLOR,
        elementTextColor: data.ELEMENT_TEXT_COLOR,
        gameBackgroundColor: data.GAME_BACKGROUND_COLOR,
        alternativeColor1: data.ALTERNATIVE_COLOR_1,
        alternativeColor2: data.ALTERNATIVE_COLOR_2,
        alternativeColor3: data.ALTERNATIVE_COLOR_3,
        alternativeColor4: data.ALTERNATIVE_COLOR_4,
        alternativeColor5: data.ALTERNATIVE_COLOR_5,
        alternativeColor6: data.ALTERNATIVE_COLOR_6,
        alternativeColor7: data.ALTERNATIVE_COLOR_7,
        alternativeColor8: data.ALTERNATIVE_COLOR_8,
        alternativeColor9: data.ALTERNATIVE_COLOR_9,
        cardBackColor: data.CARD_BACK_COLOR
    }
}
