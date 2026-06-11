import { CUSTOM_COLORS } from "./colors";

export function createCustomization(data) {
    const { LOGO, FRANJA, HIDE_EDUCAPLAY_BRAND, BACKGROUND, showBackgroundInGame = true } = data;
    return {
        customLogo: LOGO,
        customBarLogo: FRANJA,
        hideEducaplayBrand: HIDE_EDUCAPLAY_BRAND === "si",
        backgroundImage: { src: BACKGROUND, showGame: showBackgroundInGame },
        hasCustomColors: data.CUSTOM_COLORS_ENABLED === "si",
        colors: CUSTOM_COLORS(data)
    };
}