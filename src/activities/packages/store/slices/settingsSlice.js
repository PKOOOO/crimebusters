import { createSlice } from "@reduxjs/toolkit";
import { DEFAULT_MAIN_COLOR, getColorShades, getRgb, normalizeColor } from '@educaplay/core/utils'
import { openFullScreen, exitFullScreen } from '@educaplay/core/utils';

function customize(params) {
    const { hasCustomColors, primaryColor, primaryTextColor, ...colors } = params
    let shades;

    if (primaryColor) {
        shades = getColorShades(primaryColor)
    }

    const cssVar = (name, value) => hasCustomColors && value ? `--${name}: ${value};` : '';
    const cssVarRgb = (name, value) => hasCustomColors && value ? `--${name}-rgb: ${getRgb(value)};` : '';

    const generateAlternativeColors = () => {
        if (!hasCustomColors) return '';

        let result = '';
        for (let i = 1; i <= 9; i++) {
            const colorKey = `alternativeColor${i}`;
            const colorValue = colors[colorKey];
            if (colorValue) {
                result += cssVar(`alternative-color-${i}`, colorValue);
                result += cssVarRgb(`alternative-color-${i}`, colorValue);
            }
        }
        return result;
    };

    const content = `
        :root {
            ${(primaryColor && primaryColor !== DEFAULT_MAIN_COLOR) ? `
                --color-primary: ${primaryColor};
                --color-primary-rgb: ${getRgb(primaryColor)};

                --color-primary-light-7: ${shades[0].hexString()};
                --color-primary-light-7-rgb: ${shades[0].rgb.join(', ')};
                --color-primary-light-6: ${shades[1].hexString()};
                --color-primary-light-6-rgb: ${shades[1].rgb.join(', ')};
                --color-primary-light-5: ${shades[2].hexString()};
                --color-primary-light-5-rgb: ${shades[2].rgb.join(', ')};
                --color-primary-light-4: ${shades[3].hexString()};
                --color-primary-light-4-rgb: ${shades[3].rgb.join(', ')};
                --color-primary-light-3: ${shades[4].hexString()};
                --color-primary-light-3-rgb: ${shades[4].rgb.join(', ')};
                --color-primary-light-2: ${shades[5].hexString()};
                --color-primary-light-2-rgb: ${shades[5].rgb.join(', ')};
                --color-primary-light-1: ${shades[6].hexString()};
                --color-primary-light-1-rgb: ${shades[6].rgb.join(', ')};
                --color-primary-dark-1: ${shades[8].hexString()};
                --color-primary-dark-1-rgb: ${shades[8].rgb.join(', ')};
                --color-primary-dark-2: ${shades[9].hexString()};
                --color-primary-dark-2-rgb: ${shades[9].rgb.join(', ')};
                --color-primary-dark-3: ${shades[10].hexString()};
                --color-primary-dark-3-rgb: ${shades[10].rgb.join(', ')};
                --color-primary-dark-4: ${shades[11].hexString()};
                --color-primary-dark-4-rgb: ${shades[11].rgb.join(', ')};
                --color-primary-dark-5: ${shades[12].hexString()};
                --color-primary-dark-5-rgb: ${shades[12].rgb.join(', ')};
                --color-primary-dark-6: ${shades[13].hexString()};
                --color-primary-dark-6-rgb: ${shades[13].rgb.join(', ')};
                --color-primary-dark-7: ${shades[14].hexString()};
                --color-primary-dark-7-rgb: ${shades[14].rgb.join(', ')};

                --main-menu-background-gradient-max: ${shades[14].hexString()};
                --main-menu-background-gradient-max-rgb: ${shades[14].rgb.join(', ')};

                --main-menu-background-gradient-min: ${primaryColor};
                --main-menu-background-gradient-min-rgb: ${getRgb(primaryColor)};

                --game-type-color: ${shades[4].hexString()};
                --game-type-color-rgb: ${shades[4].rgb.join(', ')};

                --main-menu-container-background-color: ${primaryColor};
                --main-menu-container-background-color-rgb: ${getRgb(primaryColor)};

                --main-menu-footer-background-color: ${shades[0].hexString()};
                --main-menu-footer-background-color-rgb: ${shades[0].rgb.join(', ')};

                --color-text: ${primaryTextColor};
                --color-text-rgb: ${getRgb(primaryTextColor)};
            ` : ''}

            ${cssVar('secondary-color', colors.secondaryColor)}
            ${cssVarRgb('secondary-color', colors.secondaryColor)}

            ${cssVar('tertiary-color', colors.tertiaryColor)}
            ${cssVarRgb('tertiary-color', colors.tertiaryColor)}

            ${cssVar('main-button-color', colors.buttonInterfaceColor)}
            ${cssVarRgb('main-button-color', colors.buttonInterfaceColor)}

            ${cssVar('main-button-hover-color', colors.buttonInterfaceHoverColor)}
            ${cssVarRgb('main-button-hover-color', colors.buttonInterfaceHoverColor)}

            ${cssVar('main-button-active-color', colors.buttonInterfaceActiveColor)}
            ${cssVarRgb('main-button-active-color', colors.buttonInterfaceActiveColor)}

            ${cssVar('button-color', colors.buttonGameColor)}
            ${cssVarRgb('button-color', colors.buttonGameColor)}

            ${cssVar('button-hover-color', colors.buttonGameHoverColor)}
            ${cssVarRgb('button-hover-color', colors.buttonGameHoverColor)}

            ${cssVar('button-active-color', colors.buttonGameActiveColor)}
            ${cssVarRgb('button-active-color', colors.buttonGameActiveColor)}

            ${cssVar('secondary-text-color', colors.secondaryTextColor)}
            ${cssVarRgb('secondary-text-color', colors.secondaryTextColor)}

            ${cssVar('main-button-text-color', colors.buttonInterfaceTextColor)}
            ${cssVarRgb('main-button-text-color', colors.buttonInterfaceTextColor)}

            ${cssVar('main-button-hover-text-color', colors.buttonInterfaceHoverTextColor)}
            ${cssVarRgb('main-button-hover-text-color', colors.buttonInterfaceHoverTextColor)}

            ${cssVar('main-button-active-text-color', colors.buttonInterfaceActiveTextColor)}
            ${cssVarRgb('main-button-active-text-color', colors.buttonInterfaceActiveTextColor)}

            ${cssVar('interface-button-color', colors.buttonSecondaryInterfaceColor)}
            ${cssVarRgb('interface-button-color', colors.buttonSecondaryInterfaceColor)}

            ${cssVar('interface-button-hover-color', colors.buttonSecondaryInterfaceHoverColor)}
            ${cssVarRgb('interface-button-hover-color', colors.buttonSecondaryInterfaceHoverColor)}

            ${cssVar('interface-button-active-color', colors.buttonSecondaryInterfaceActiveColor)}
            ${cssVarRgb('interface-button-active-color', colors.buttonSecondaryInterfaceActiveColor)}

            ${cssVar('interface-button-text-color', colors.buttonSecondaryInterfaceTextColor)}
            ${cssVarRgb('interface-button-text-color', colors.buttonSecondaryInterfaceTextColor)}

            ${cssVar('interface-button-hover-text-color', colors.buttonSecondaryInterfaceHoverTextColor)}
            ${cssVarRgb('interface-button-hover-text-color', colors.buttonSecondaryInterfaceHoverTextColor)}

            ${cssVar('interface-button-active-text-color', colors.buttonSecondaryInterfaceActiveTextColor)}
            ${cssVarRgb('interface-button-active-text-color', colors.buttonSecondaryInterfaceActiveTextColor)}

            ${cssVar('button-text-color', colors.buttonGameTextColor)}
            ${cssVarRgb('button-text-color', colors.buttonGameTextColor)}

            ${cssVar('button-hover-text-color', colors.buttonGameHoverTextColor)}
            ${cssVarRgb('button-hover-text-color', colors.buttonGameHoverTextColor)}

            ${cssVar('button-active-text-color', colors.buttonGameActiveTextColor)}
            ${cssVarRgb('button-active-text-color', colors.buttonGameActiveTextColor)}

            ${cssVar('button-border-color', colors.buttonBorderColor)}
            ${cssVarRgb('button-border-color', colors.buttonBorderColor)}

            ${cssVar('button-hover-border-color', colors.buttonHoverBorderColor)}
            ${cssVarRgb('button-hover-border-color', colors.buttonHoverBorderColor)}

            ${cssVar('error-text-color', colors.errorTextColor)}
            ${cssVarRgb('error-text-color', colors.errorTextColor)}

            ${cssVar('success-text-color', colors.successTextColor)}
            ${cssVarRgb('success-text-color', colors.successTextColor)}

            ${cssVar('accent-text-color', colors.accentTextColor)}
            ${cssVarRgb('accent-text-color', colors.accentTextColor)}

            ${cssVar('main-menu-background-gradient-color', colors.gradientBackgroundColor)}
            ${cssVarRgb('main-menu-background-gradient-color', colors.gradientBackgroundColor)}

            ${cssVar('accent-hover-text-color', colors.accentHoverTextColor)}
            ${cssVarRgb('accent-hover-text-color', colors.accentHoverTextColor)}

            ${cssVar('element-text-color', colors.elementTextColor)}
            ${cssVarRgb('element-text-color', colors.elementTextColor)}

            ${cssVar('main-menu-background-color', colors.mainMenuBackgroundColor)}
            ${cssVarRgb('main-menu-background-color', colors.mainMenuBackgroundColor)}

            ${cssVar('game-icon-color', colors.iconGameColor)}
            ${cssVarRgb('game-icon-color', colors.iconGameColor)}

            ${cssVar('game-title-color', colors.titleTextColor)}
            ${cssVarRgb('game-title-color', colors.titleTextColor)}

            ${cssVar('game-type-color', colors.typeTextColor)}
            ${cssVarRgb('game-type-color', colors.typeTextColor)}

            ${cssVar('accent-color', colors.accentColor)}
            ${cssVarRgb('accent-color', colors.accentColor)}

            ${cssVar('accent-hover-color', colors.accentHoverColor)}
            ${cssVarRgb('accent-hover-color', colors.accentHoverColor)}

            ${cssVar('accent-border-color', colors.accentBorderColor)}
            ${cssVarRgb('accent-border-color', colors.accentBorderColor)}

            ${cssVar('game-error-color', colors.errorColor)}
            ${cssVarRgb('game-error-color', colors.errorColor)}

            ${cssVar('game-success-color', colors.successColor)}
            ${cssVarRgb('game-success-color', colors.successColor)}

            ${cssVar('element-background-color', colors.elementBackgroundColor)}
            ${cssVarRgb('element-background-color', colors.elementBackgroundColor)}

            ${cssVar('element-border-color', colors.elementBorderColor)}
            ${cssVarRgb('element-border-color', colors.elementBorderColor)}

            ${cssVar('game-background-color', colors.gameBackgroundColor)}
            ${cssVarRgb('game-background-color', colors.gameBackgroundColor)}

            ${cssVar('game-progress-color', colors.progressColor)}
            ${cssVarRgb('game-progress-color', colors.progressColor)}

            ${cssVar('card-back-color', colors.cardBackColor)}
            ${cssVarRgb('card-back-color', colors.cardBackColor)}

            ${generateAlternativeColors()}

        }
    `;

    const styleElement = document.querySelector('[data-id="game-styles"]')
    if (styleElement) {
        styleElement.innerHTML = content
    } else {
        const styles = document.createElement('style')
        styles.dataset.id = 'game-styles'
        styles.innerHTML = content
        document.head.appendChild(styles);
    }
}

const initialState = {
    ads: false,
    rating: {
        url: null
    },
    resources: '',
    login: {
        url: ''
    },
    customizations: {
        colors: {},
        backgroundImage: { src: null, showGame: true },
        customLogo: null,
        customBarLogo: null
    },
    isOpen: false,
    isFullscreen: false
}

const settingsSlice = createSlice({
    initialState,
    name: 'settings',
    reducers: {
        initSettings(state, action) {
            const { customizations, settings } = action.payload
            const { ads, rating, resources, login } = settings
            const { customLogo, customBarLogo, colors, backgroundImage, hasCustomColors } = customizations
            const HexColors = Object.fromEntries(
                Object.entries(colors).map(([colorname, colorvalue]) => [colorname, normalizeColor(colorvalue, colorname, colors)])
            );
            if (colors.primaryColor) {
                customize({
                    hasCustomColors,
                    ...(colors.primaryColor && {
                        ...HexColors
                    }),
                })
            }

            state.showUser = !!settings.login.url
            state.ads = ads
            state.rating = rating
            state.resources = resources
            state.login = login
            state.customizations = {
                colors,
                backgroundImage: { src: backgroundImage.src ? `${resources}${backgroundImage.src}` : null, showGame: backgroundImage.showGame },
                customLogo: customLogo ? `${resources}${customLogo}` : null,
                customBarLogo: customBarLogo ? `${resources}${customBarLogo}` : null,
                showEducaplayBrand: !customizations.hideEducaplayBrand,
            }
        },
        toggleSettings(state, action) {
            state.isOpen = action.payload
        },
        toggleFullscreen(state, action) {
            if (state.isFullscreen === action.payload) return

            const isActive = action.payload
            const fullscreenAction = isActive ? openFullScreen : exitFullScreen
            fullscreenAction()

            state.isFullscreen = isActive
        }
    }
})


export const { initSettings, toggleSettings, toggleFullscreen } = settingsSlice.actions
export default settingsSlice.reducer