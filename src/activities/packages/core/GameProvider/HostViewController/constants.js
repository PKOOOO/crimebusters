import { HOST_VIEWS } from "@educaplay/store/constants";

export const DEBUG_MODE = true;

export const QUESTION_COUNTDOWN_SECONDS = 5;

export const DELAYS = {
    CORRECT_TO_STATS: 2500,
    STATS_TO_RANKING: 5000,
    RANKING_TO_NEXT: 5000,
};

// Duración total del intercambio entre los modals de stats y ranking cuando el
// host avanza manualmente. AnimatePresence con mode="wait" reparte este tiempo
// entre el exit del primero (~50%) y el enter del segundo (~50%)
export const MODAL_TRANSITION_MS = 800;

export const VIEW_LABELS = {
    [HOST_VIEWS.QUESTION_STATEMENT]: "ENUNCIADO",
    [HOST_VIEWS.GAME_VIEW]: "JUEGO",
    [HOST_VIEWS.CORRECT_ANSWER]: "CORRECTA",
    [HOST_VIEWS.ANSWER_STATS]: "STATS",
    [HOST_VIEWS.RANKING]: "RANKING",
    [HOST_VIEWS.RESULTS]: "RESULTADOS",
};
