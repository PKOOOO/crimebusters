import { IS_DEV } from './constants';
import { formatUrl } from './format';

const KEY = '9xnr4H8_8Hidh67679';


export async function getConfig() {
    const decrypt = (data, key) => {
        let decrypted = '';
        const keyLength = key.length;
        const encryptedBytes = atob(data);
        for (let i = 0; i < encryptedBytes.length; i++) {
            decrypted += String.fromCharCode(encryptedBytes.charCodeAt(i) ^ key.charCodeAt(i % keyLength));
        }

        return JSON.parse(decrypted);
    }
    const config = window.__EDUCAPLAY_GAME_CONFIG;
    const id = window.__EDUCAPLAY_GAME_ID
    const apiURL = window.__EDUCAPLAY_API_URL ?? "https://api.dev.educaplay.com";

    if (!config) {
        throw new Error("No config found");
    }

    if (typeof config.data === "string") {
        return {
            ...config,
            data: decrypt(config.data, KEY)
        }
    }

    // Nota: el bootstrap dev por PIN (resolver activityId vía lobby-data y
    // registrar player anónimo vía anonymous-join) se quitó tras la
    // refactorización a WS-only. Para probar multijugador en dev local hay
    // que abrir la URL real del lobby (https://dev.educaplay.com/match/{pin}/);
    // lobbyScreen autogenera la identidad. Pendiente: rehabilitar Vite-only
    // pasando todo por mensajes WS.

    if (IS_DEV && id) {
        const devToken = import.meta.env.VITE_APP_tokenID;
        const authHeaders = devToken ? { Authorization: `Bearer ${devToken}` } : {};
        const response = await fetch(`${apiURL}/resources/${id}/?extended=true&dev=true`, {
            credentials: 'include',
            headers: authHeaders
        })
            .then(response => response.json())
        return {
            ...config,
            ...response,
            user: config.user
        }
    }

    return config;
}

const formatResourceUrl = (baseUrl, url) => {
    const formattedUrl = formatUrl(baseUrl, url);

    const firstChar = formattedUrl[0];

    if (firstChar === "/") {
        return formattedUrl.slice(1);
    }

    return formattedUrl;
}


export function assetsUrl(url) {
    if (IS_DEV) {
        // get asssets from plublic folder
        return formatUrl('/assets/', url);
    }

    if (typeof window?.getResource === 'function') {
        const formattedUrl = formatResourceUrl('activitiesassets/', url);
        return window.getResource(formattedUrl);
    }

    const config = window.__EDUCAPLAY_GAME_CONFIG;
    return formatUrl(config.settings.mainResources, url);
}