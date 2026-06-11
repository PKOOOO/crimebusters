import { useEffect } from "react";
import { assetsUrl } from "../../utils";

export function FontFamilyProvider({ children }) {

    useEffect(() => {
        const fontFamilyUrl = assetsUrl("common/Nunito-VariableFont_wght.ttf");
        const content = `
            @font-face {
                font-family: 'Nunito';
                src: url("${fontFamilyUrl}") format('truetype');
            }
        `;
        const styleElement = document.querySelector('[data-id="game-font-familay"]')
        if (styleElement) {
            styleElement.innerHTML = content
        } else {
            const styles = document.createElement('style')
            styles.dataset.id = 'game-font-familay'
            styles.innerHTML = content
            document.head.appendChild(styles);
        }
    }, [])

    return children
}