import { configureStore } from '@reduxjs/toolkit'
import gameReducer, { initGame } from './slices/gameSlice'
import multiplayerReducer, { initMatch, setPlayer } from './slices/multiplayerSlice'
import settingsReducer, { initSettings } from './slices/settingsSlice';
import { shuffleAnswersInQuestions } from './utils/shuffleAnswers';

export const store = configureStore({
    reducer: {
        game: gameReducer,
        multiplayer: multiplayerReducer,
        settings: settingsReducer
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: false,
        }),
})

export const initialize = ({ settings, customizations, match: matchParam, ...config }) => {
    const match = matchParam
    // En multiplayer ciertas opciones no aplican: el orden de preguntas y el ritmo
    // los gobierna el host, las vidas individuales pierden sentido y las respuestas
    // no se mezclan (todos los clientes deben verlas en el mismo orden).
    // En single-player mezclamos las respuestas centralmente solo si la actividad
    // lo pide (randomizedAnswers); si no, se respeta el orden original.
    const gameConfig = match
        ? { ...config, randomized: false, liveActived: false }
        : { ...config, questions: config.randomizedAnswers ? shuffleAnswersInQuestions(config.questions) : config.questions }
    store.dispatch(initGame(gameConfig))
    store.dispatch(initSettings({ settings, customizations }))
    if (config.user) {
        store.dispatch(setPlayer({ token: config.user.token, userType: config.user.type }))
    }
    if (match) {
        store.dispatch(initMatch(match))
    }
}