import { createSlice } from "@reduxjs/toolkit";
import { shuffle } from "../utils/shuffle";
import { SCREENS } from "../constants";
import { isUnansweredAnswer } from "../utils/functions";
import { initMatch, matchRestarted, matchStarted, setLobbyData } from "./multiplayerSlice";
import { applyOrdersToQuestions } from "../utils/applyOrders";

// Aplica las permutaciones combinadas (questionOrder + answerOrders) sobre la
// copia pristina de las preguntas. Siempre parte de pristineQuestions para que
// reaplicar sea idempotente (p.ej. cuando el host envía questionOrder y luego
// el cliente añade su answerOrder local)
function reapplyOrders(state, orders) {
    if (!state.pristineQuestions || state.pristineQuestions.length === 0) return;
    if (!orders || (!orders.questionOrder && !orders.answerOrders)) {
        state.initialQuestions = state.pristineQuestions;
        state.questions = state.pristineQuestions;
        return;
    }
    const reordered = applyOrdersToQuestions(state.pristineQuestions, orders);
    state.initialQuestions = reordered;
    state.questions = reordered;
}

const initialState = {
    points: 0,
    pointsFormatted: "0",
    pointsRoundedFormatted: "0",
    lives: 0,
    initialLives: 0,
    view: SCREENS.MAIN_MENU,
    liveActived: false,
    hasCountDown: false,
    showClock: true,
    hasProgressBar: { view: false, onlyCorrect: false },
    randomized: false,
    countFooterSpace: false,
    initialQuestions: [],
    questions: [],
    isCompleteEntryAnimation: false,
    examMode: false,
    hasBank: false,
    hasQuestionBank: false,
    currentIndex: 0,
    time: 0,
    isAnimating: false,
    showSolutions: false,
    showRestart: false,
    showSocialMedia: false,
    hasSkip: false,
    showUserAnswer: false,
    numberOfQuestions: null,
    globalCountdown: null,
    initialGlobalCountdown: null,
    showFeedbackGame: {
        isCorrect: false,
        isError: false
    },
    showBankControl: true,
    hasInfinityTries: false,
    semiCorrect: false,
    automaticallyFinishGame: true,
    showButtonReports: true,
    audioSettings: {
        showAudioControls: false,
        allowPause: true,
    },
    showUserTries: false,
    negativePoints: null,
    isBankHidden: false,
    bankOffsetY: 0,

    // Catálogo de settings específicos del juego para el panel multijugador.
    // Cada juego puede declararlo en initialize({ multiplayerSettings }). Si
    // es null se usa únicamente el catálogo core
    multiplayerSettings: null,

    // static data
    user: null,
    title: "",
    url: "",
    description: "",
    author: "",
    id: "",
    finalText: "",

    // pause state
    isPaused: false,
}

const gameSlice = createSlice({
    initialState,
    name: 'game',
    reducers: {
        setView(state, action) {
            state.view = action.payload
        },
        finishEntryAnimation(state) {
            state.isCompleteEntryAnimation = true;
        }
        ,
        setAnimating(state, action) {
            state.isAnimating = action.payload
        },
        startGame(state, action) {
            state.isCompleteEntryAnimation = false;
            state.view = SCREENS.GAME
            state.isPaused = false
            state.points = 0
            state.pointsFormatted = "0"
            state.pointsRoundedFormatted = "0"
            state.lives = state.initialLives
            state.currentIndex = action?.payload?.startIndex ?? 0
            state.showBankControl = true;
            state.negativePoints = null;
            state.bankOffsetY = 0;

            state.time = 0
            state.globalCountdown = state.initialGlobalCountdown
            state.isBankHidden = false

            if (state.randomized) {
                state.questions = shuffle(state.initialQuestions)
            } else {
                state.questions = state.initialQuestions;
            }

            if (state.refreshQuestions) {
                state.questions = state.refreshQuestions?.(state.initialQuestions);
            }

            if (state.numberOfQuestions) {
                state.questions = state.questions.slice(0, state.numberOfQuestions);
            }

            if (state.hasInfinityTries) {
                state.questions = state.questions.map((question) => ({ ...question, tries: [] }));
            }
        },
        incrementTime(state) {
            state.time += 1
        },

        incrementIndex(state) {
            state.isBankHidden = false
            if (state.currentIndex + 1 > state.questions.length - 1) {
                state.currentIndex = 0;
                return;
            }
            state.currentIndex += 1

        },

        decreaseIndex(state) {
            state.isBankHidden = false
            if (state.currentIndex - 1 < 0) {
                state.currentIndex = state.questions.length - 1;
                return;
            }
            state.currentIndex -= 1
        },

        setIndex(state, action) {
            state.isBankHidden = false
            state.currentIndex = action.payload
        },

        decreaseQuestionTime(state) {
            state.questions[state.currentIndex].time -= 1;
        },

        setQuestionTime(state, action) {
            const { index, time } = action.payload;
            if (state.questions[index]) {
                state.questions[index].time = time;
            }
            if (state.initialQuestions[index]) {
                state.initialQuestions[index].time = time;
            }
        },

        decreaseGlobalCountdown(state) {
            state.globalCountdown -= 1;
        },

        initGame(state, action) {
            const {
                lives, liveActived, hasCountDown, showClock = true, questions, user, title, url, description, author, id,
                finalText, randomized = false, hasBank = false, showSolutions, showRestart, showSocialMedia,
                hasSkip = false, showUserAnswer = false, countFooterSpace, examMode, numberOfQuestions = null,
                hasProgressBar = { view: false, onlyCorrect: false }, globalCountdown = null, showFeedbackGame = { isCorrect: false, isError: false }, hasInfinityTries = false,
                semiCorrect = false, automaticallyFinishGame = true, showButtonReports = true, showUserTries = false,
                audioSettings = { showAudioControls: false, allowPause: true }, refreshQuestions, hasQuestionBank = false,
                multiplayerSettings = null
            } = action.payload

            state.initialLives = lives
            state.lives = lives
            state.liveActived = liveActived
            state.hasCountDown = hasCountDown
            state.showClock = showClock
            state.randomized = randomized
            state.initialQuestions = questions
            state.questions = hasInfinityTries ? questions.map((question) => ({ ...question, tries: [] })) : questions
            // Guardamos la copia pristina antes de cualquier permutación multi
            // para poder reaplicar orders de forma idempotente (p.ej. tras un
            // restartMatch con settings distintos)
            state.pristineQuestions = state.questions
            state.user = user
            state.title = title
            state.url = url
            state.description = description
            state.examMode = examMode
            state.countFooterSpace = countFooterSpace
            state.author = author
            state.id = id
            state.hasBank = hasBank
            state.hasQuestionBank = hasQuestionBank
            state.finalText = finalText
            state.showSolutions = showSolutions
            state.showRestart = showRestart
            state.showUserAnswer = showUserAnswer
            state.showSocialMedia = showSocialMedia
            state.hasSkip = hasSkip
            state.numberOfQuestions = numberOfQuestions
            state.hasProgressBar = hasProgressBar;
            state.globalCountdown = globalCountdown;
            state.initialGlobalCountdown = globalCountdown;
            state.showFeedbackGame = showFeedbackGame;
            state.semiCorrect = semiCorrect;
            state.hasInfinityTries = hasInfinityTries;
            state.automaticallyFinishGame = automaticallyFinishGame;
            state.showButtonReports = showButtonReports;
            state.showUserTries = showUserTries;
            state.audioSettings = audioSettings;
            state.refreshQuestions = refreshQuestions;
            state.bankOffsetY = 0;
            state.multiplayerSettings = multiplayerSettings;
        },
        goToQuestion(state, action) {
            state.isBankHidden = false
            state.currentIndex = action.payload;
        },
        saveAnswer(state, action) {
            state.questions[state.currentIndex].answer = action.payload
            if (state.hasInfinityTries) {
                state.questions[state.currentIndex].tries.push(action.payload)
            }
        },
        answerOrderingQuestion(state, action) {
            const { answer, points, isCorrect, isCompleted } = action.payload;
            const { currentIndex, questions } = state;

            state.questions[currentIndex].answer = answer;

            state.points = Math.min(100, state.points + points);
            state.pointsFormatted = state.points.toFixed(3);
            state.pointsRoundedFormatted = state.points.toFixed(0);

            if (!isCorrect && state.hasInfinityTries) {
                state.questions[currentIndex].tries.push(answer);
            }

            if (!isCorrect && state.liveActived) {
                const lives = Math.max(0, state.lives - 1)
                state.lives = lives

                if (lives === 0) {
                    state.view = SCREENS.SCORE_SCREEN
                    return;
                }
            }

            if (!isCompleted) {
                return;
            }

            if (currentIndex >= questions.length - 1) {
                state.view = SCREENS.SCORE_SCREEN
            } else {
                state.currentIndex += 1
            }
        },
        answerQuestion(state, action) {

            const { questionIndexAnswer = null, answer, points, isCorrect, semiCorrect = false, nextQuestionIndex, skipResult = false } = action.payload;

            const time = state.globalCountdown !== null
                ? state.globalCountdown
                : state.questions[state.currentIndex].time;

            const index = questionIndexAnswer ?? state.currentIndex;
            if (state.questions[index]) {
                state.questions[index].answer = answer;
                if (!skipResult) {
                    state.questions[index].answerResult = { isCorrect, points };
                }
            }

            // En multijugador el servidor gestiona puntos/vidas; solo registramos
            // la respuesta cruda y esperamos el resultado autoritativo
            if (skipResult) {
                if (nextQuestionIndex !== undefined) {
                    state.currentIndex = nextQuestionIndex;
                }
                return;
            }

            state.isBankHidden = false
            if (isCorrect || semiCorrect) {
                state.points = Math.min(100, state.points + points)
                state.pointsFormatted = state.points.toFixed(3)
                state.pointsRoundedFormatted = state.points.toFixed(0)

                if (semiCorrect && !isCorrect && state.liveActived) {
                    const lives = Math.max(0, state.lives - 1)
                    state.lives = lives

                    if (lives === 0) {
                        state.view = SCREENS.SCORE_SCREEN
                    }
                }


            } else if (state.liveActived) {
                const lives = Math.max(0, state.lives - 1)
                state.lives = lives

                if (lives === 0) {
                    state.view = SCREENS.SCORE_SCREEN
                }
            }
            if (state.hasInfinityTries && !isCorrect && time !== 0) {
                state.questions[index]?.tries?.push(answer);
                return;
            }

            const { currentIndex, questions, hasSkip } = state;
            if (nextQuestionIndex !== undefined) {
                state.currentIndex = nextQuestionIndex;
                return;
            }

            const questionsOrdered = [...questions.slice(currentIndex + 1), ...questions.slice(0, currentIndex + 1)]
            const nextQuestion = questionsOrdered.find(({ answer }) => answer === null);
            if (!nextQuestion) {
                if (!state.automaticallyFinishGame) return;
                state.view = SCREENS.SCORE_SCREEN
                return;
            }

            const matchNextQuestion = questions.findIndex(({ id }) => id === nextQuestion.id)

            if (hasSkip) {
                state.currentIndex = matchNextQuestion;
                return;
            }

            if (currentIndex >= questions.length - 1) {
                if (!state.automaticallyFinishGame) return;
                state.view = SCREENS.SCORE_SCREEN
                return;
            }

            state.currentIndex += 1
        },
        updateAnswerResult(state, action) {
            const { questionIndex, isCorrect, realPoints, arcadePoints } = action.payload;
            if (state.questions[questionIndex]) {
                // points = arcade es alias para no romper el código existente
                // que lee answerResult.points (PlayerPointsModal, etc.)
                state.questions[questionIndex].answerResult = {
                    isCorrect,
                    realPoints,
                    arcadePoints,
                    points: arcadePoints,
                };
            }
        },
        sendExam(state) {
            const sumPoints = Math.max(state.questions.reduce((accumulator, question) => accumulator + question.calculatePoints(question.answer), 0), 0);

            state.points = Math.min(100, state.points + sumPoints);
            state.pointsFormatted = state.points.toFixed(3);
            state.pointsRoundedFormatted = state.points.toFixed(0);

            state.view = SCREENS.SCORE_SCREEN;
        },
        skipQuestion(state) {
            //skip to the first empty question since currentindex
            const { currentIndex, questions } = state;
            const questionsOrdered = [...questions.slice(currentIndex + 1), ...questions.slice(0, currentIndex + 1)]
            const nextQuestion = questionsOrdered.find(({ answer }) => isUnansweredAnswer(answer));

            if (!nextQuestion) return;
            state.isBankHidden = false
            state.currentIndex = questions.findIndex(({ id }) => id === nextQuestion.id)
        },

        skipQuestionBackward(state) {
            const { currentIndex, questions } = state;
            const questionsOrdered = [...questions.slice(currentIndex), ...questions.slice(0, currentIndex)];
            const prevQuestion = questionsOrdered.reverse().find(({ answer }) => isUnansweredAnswer(answer));

            if (!prevQuestion) return;

            state.isBankHidden = false
            state.currentIndex = questions.findIndex(({ id }) => id === prevQuestion.id);
        },

        finishGame(state, action) {
            if (action.payload?.points !== undefined) {
                state.points = action.payload.points;
                state.pointsFormatted = state.points.toFixed(3);
                state.pointsRoundedFormatted = state.points.toFixed(0);
            }

            state.view = SCREENS.SCORE_SCREEN
        },

        finishGlobalTime(state) {
            state.view = SCREENS.SCORE_SCREEN
        },

        setShowBankControl(state, action) {
            state.showBankControl = action.payload;
        },

        setBankOffsetY(state, action) {
            state.bankOffsetY = action.payload;
        },

        setNegativePoints(state, action) {
            state.negativePoints = action.payload;
        },

        hideBank(state, action) {
            state.isBankHidden = action.payload;
        },

        pauseGame(state) {
            state.isPaused = true;
        },
        resumeGame(state) {
            state.isPaused = false;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(initMatch, (state) => {
                state.view = SCREENS.LOBBY;
            })
            .addCase(matchRestarted, (state) => {
                state.view = SCREENS.LOBBY;
                // Al reiniciar una partida multi, revertimos al orden pristino
                // para poder reaplicar nuevos orders en el siguiente start
                if (state.pristineQuestions) {
                    state.initialQuestions = state.pristineQuestions;
                    state.questions = state.pristineQuestions;
                }
            })
            // Cuando el host arranca el match (matchStarted con orders) o al
            // rehidratar un match ya iniciado (setLobbyData.orders),
            // recalculamos las preguntas ordenadas. Mutar aquí evita tener que
            // tocar los 60+ consumidores de state.game.questions;
            // pristineQuestions hace el proceso idempotente
            .addCase(matchStarted, (state, action) => {
                const questionOrder = action.payload?.questionOrder ?? null;
                const answerOrders = action.payload?.answerOrders ?? null;
                reapplyOrders(state, { questionOrder, answerOrders });
                state._appliedQuestionOrder = questionOrder;
                state._appliedAnswerOrders = answerOrders;
            })
            .addCase(setLobbyData, (state, action) => {
                const orders = action.payload?.orders;
                if (!orders) return;
                reapplyOrders(state, orders);
                state._appliedQuestionOrder = orders.questionOrder ?? null;
                state._appliedAnswerOrders = orders.answerOrders ?? null;
            });
    }
})


export const {
    setView, initGame, startGame, incrementTime, decreaseIndex, setIndex, saveAnswer,
    finishEntryAnimation, decreaseQuestionTime, setQuestionTime, answerQuestion, setAnimating,
    skipQuestion, incrementIndex, finishGlobalTime, decreaseGlobalCountdown,
    sendExam, finishGame, skipQuestionBackward, setShowBankControl, goToQuestion,
    setNegativePoints, hideBank, answerOrderingQuestion, setBankOffsetY,
    pauseGame, resumeGame, updateAnswerResult
} = gameSlice.actions
export default gameSlice.reducer