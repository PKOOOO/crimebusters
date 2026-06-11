import { API_URL } from '@educaplay/core/utils/constants';
import { store } from '@educaplay/store';

// --- Cliente WS singleton registrado por el WebSocketProvider ---

let _wsClient = null;
export function setWsClient(client) {
    _wsClient = client;
}
function ws() {
    if (!_wsClient) {
        throw new Error('wsClient not initialized');
    }
    return _wsClient;
}

// --- APIs REST que se mantienen (uploads que no encajan en WS) ---

const fetcher = (endpoint, options = {}) => {
    const player = store.getState().multiplayer.player;
    const headers = { ...options.headers };
    if (player?.token) {
        if (player.userType === 'anonymous') {
            headers['X-Anonymous-Token'] = player.token;
        } else {
            headers['Authorization'] = `Bearer ${player.token}`;
        }
    } else if (import.meta.env.DEV) {
        console.warn('[multiplayer.fetcher] player.token vacío al llamar', endpoint, '— revisa que VITE_APP_tokenID esté definido y que Vite se haya reiniciado.');
    }

    return fetch(`${API_URL}${endpoint}`, {
        ...options,
        credentials: 'include',
        headers
    });
};

export const uploadMatchBackground = async (matchId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetcher(`/matches/${matchId}/background/`, {
        method: 'POST',
        body: formData
    });
    if (!response.ok) {
        throw new Error('Failed to upload background');
    }
    return await response.json();
};

export const deleteMatchBackground = async (matchId) => {
    const response = await fetcher(`/matches/${matchId}/background/`, {
        method: 'DELETE'
    });
    if (!response.ok) {
        throw new Error('Failed to delete background');
    }
    return await response.json();
};

// Bundle de textos de interfaz (common + sección del tipo) en un idioma, para
// cambiar el idioma de la interfaz multijugador en caliente. La respuesta es
// cacheable, así que repeticiones del mismo idioma salen de la caché del navegador.
export const getInterfaceTexts = async (lang, type) => {
    const response = await fetcher(`/texts/match/${lang}/${type}/`);
    if (!response.ok) {
        throw new Error('Failed to fetch interface texts');
    }
    return await response.json();
};

// --- Acciones multiplayer migradas a WebSocket ---

export const startMatch = ({ questionOrder = null, answerOrders = null } = {}) =>
    ws().request('startMatch', { questionOrder, answerOrders });

export const updateSettings = (settings) =>
    ws().request('updateSettings', { settings });

export const kickPlayer = (playerId) =>
    ws().request('kickPlayer', { playerId });

export const toggleLock = (locked) =>
    ws().request('toggleLock', { locked });

export const checkPlayers = () =>
    ws().request('checkPlayers', {});

export const sendEmoji = (emojiId) =>
    ws().request('sendEmoji', { emojiId });

export const startQuestion = (questionIndex) =>
    ws().request('startQuestion', { questionIndex });

export const setQuestionDeadline = (seconds) =>
    ws().request('setQuestionDeadline', { seconds });

export const endQuestion = (reason = 'forced') =>
    ws().request('endQuestion', { reason });

export const submitAnswer = (questionIndex, answer) =>
    ws().request('submitAnswer', { questionIndex, answer });

export const leaveMatch = () =>
    ws().request('leaveMatch', {});

export const revealPosition = (position) =>
    ws().request('revealPosition', { position });

export const notifyRankingShown = () =>
    ws().request('notifyRankingShown', {});

export const finishMatch = () =>
    ws().request('finishMatch', {});

export const closeMatch = () =>
    ws().request('closeMatch', {});

export const restartMatch = () =>
    ws().request('restartMatch', {});

export const submitMatchFeedback = ({ gameStars, learningLike, recommendLike }) =>
    ws().request('submitMatchFeedback', { gameStars, learningLike, recommendLike });

export const skipMatchFeedback = () =>
    ws().request('skipMatchFeedback', {});

export const getMatchFeedback = () =>
    ws().request('getMatchFeedback', {});

export const setFeedbackVisibility = (visible) =>
    ws().request('setFeedbackVisibility', { visible: !!visible });
