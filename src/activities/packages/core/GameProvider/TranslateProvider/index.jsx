import { TranslateContext } from "./TranslateContext"
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import PropTypes from "prop-types";
import { IS_DEV } from "../../utils";
import { getInterfaceTexts } from "../../services/multiplayer";

function flatObject(obj, prefix = "") {
    return Object.entries(obj).reduce((acc, [key, value]) => {
        if (typeof value === 'object') {
            return {
                ...acc,
                ...flatObject(value, `${prefix}${key}.`)
            }
        }
        return {
            ...acc,
            [`${prefix}${key}`]: value
        }
    }, {})
}

export function TranslateProvider({ children, texts }) {
    // Idioma base = el de la actividad, cuyos textos llegan horneados en el HTML
    // (prop `texts`). En multijugador el host puede elegir otro idioma de interfaz
    // desde el lobby; ese cambio se propaga por WebSocket a todos y aquí pedimos
    // su bundle al endpoint y lo intercambiamos en caliente, sin recargar.
    const interfaceLanguage = useSelector(state => state.multiplayer.settings?.interfaceLanguage);
    const activityLang = useSelector(state => state.multiplayer.match?.activityLang);
    const activityType = useSelector(state => state.multiplayer.match?.activityType);

    const [activeTexts, setActiveTexts] = useState(texts);

    // Caché de bundles por código de idioma, sembrada con el idioma base para no
    // volver a pedirlo nunca.
    const cacheRef = useRef(null);
    if (cacheRef.current === null) {
        cacheRef.current = new Map();
        if (activityLang) cacheRef.current.set(activityLang, texts);
    }
    useEffect(() => {
        if (activityLang) cacheRef.current.set(activityLang, texts);
    }, [texts, activityLang]);

    useEffect(() => {
        // Sin idioma elegido o coincide con el de la actividad: usamos la base.
        if (!interfaceLanguage || interfaceLanguage === activityLang) {
            setActiveTexts((activityLang && cacheRef.current.get(activityLang)) || texts);
            return;
        }
        // Ya cacheado: swap inmediato.
        const cached = cacheRef.current.get(interfaceLanguage);
        if (cached) {
            setActiveTexts(cached);
            return;
        }
        if (!activityType) return;
        // No cacheado: pedimos el bundle. Si el idioma cambia mientras llega,
        // descartamos la respuesta obsoleta. Si falla, mantenemos los textos
        // actuales para no romper la UI.
        let cancelled = false;
        getInterfaceTexts(interfaceLanguage, activityType)
            .then(bundle => {
                if (cancelled || !bundle) return;
                cacheRef.current.set(interfaceLanguage, bundle);
                setActiveTexts(bundle);
            })
            .catch(() => {
                if (IS_DEV) console.warn(`Failed to load interface texts for ${interfaceLanguage}`);
            });
        return () => { cancelled = true; };
    }, [interfaceLanguage, activityLang, activityType, texts]);

    const flatTexts = useMemo(() => flatObject(activeTexts), [activeTexts])

    const translate = useCallback((text, params = {}) => {
        let matchText = flatTexts[text]

        if (!matchText && IS_DEV) {
            console.warn(`Text ${text} not found`)
            return text
        }

        for (const param in params) {
            const key = `%${param}%`;
            const value = params[param];
            matchText = matchText.replaceAll(key, value)
        }
        return matchText ?? ""
    }, [flatTexts])

    return (
        <TranslateContext.Provider value={translate}>
            {children}
        </TranslateContext.Provider>
    )
}

TranslateProvider.propTypes = {
    children: PropTypes.node,
    texts: PropTypes.object
}
