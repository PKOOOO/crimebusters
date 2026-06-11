import { createSlice } from "@reduxjs/toolkit";

function normalizePlayer(player) {
    return { ...player, id: String(player.id) };
}

const initialQuestionState = {
    index: null,
    phase: null,
    startedAt: null,
    deadline: null,
    deadlineDuration: null,
    alreadyAnswered: false,
    // Payload (ya canonicalizado a answer.id) de la respuesta que el jugador
    // envió antes del F5. Se usa una sola vez para repoblar
    // state.game.questions[i].answer y restaurar el modal "has respondido X";
    // luego un hook lo consume y lo deja en null para no reprocesarlo.
    playerAnswer: null,
    answeredCount: 0,
    stats: null,
};

const initialFeedbackState = {
    // Jugador: true si ya ha enviado o saltado la valoración post-partida
    submitted: false,
    // Host: agregados { count, starsAvg, starsCount, learning: {up,down,skipped}, recommend: {up,down,skipped} }
    aggregates: null,
    // Controlado por el host: cuando es true, el player muestra el modal de
    // valoraciones en lugar del modal de posición final
    visible: false,
};

const initialState = {
    player: null,
    match: null,
    role: null,
    players: [],
    // true mientras el WS está rehidratando el backlog. Se baja a false
    // cuando el cliente ha estado 500ms sin recibir mensajes (asumimos que
    // la rehidratación ha terminado). El lobby no pinta nada hasta que esto
    // sea false: si pintáramos antes veríamos parpadeos según va llegando
    // cada mensaje del histórico.
    rehydrating: true,
    started: false,
    finished: false,
    ranking: [],
    // true cuando el host está mostrando el modal de ranking entre preguntas.
    // El player lo usa para revelar su posición dentro del PlayerPointsModal.
    // Se resetea en cada questionStarted y en matchRestarted
    rankingShown: false,
    maxRevealedPosition: null,
    question: initialQuestionState,
    // Histórico de estadísticas por índice de pregunta: { [questionIndex]: { totalAnswers, buckets } }.
    // Se alimenta con cada evento answerStats para poder construir la pantalla de resumen final
    questionStats: {},
    // Datos del player actual rehidratados desde el backend en una reconexión
    playerData: null,
    // Valoraciones post-partida (3 preguntas: estrellas, aprendizaje, recomendado)
    feedback: initialFeedbackState,
    // Settings del host (randomizar preguntas/respuestas, emojis habilitados, etc.).
    // Se hidratan desde el backend y se actualizan via broadcast 'settingsUpdated'
    settings: null,
    // Permutaciones de orden aplicadas a state.game.questions, comunes a todos
    // los participantes:
    //   - questionOrder: array global con el orden de las preguntas (el host
    //     dirige el flujo con startQuestion($index)).
    //   - answerOrders: orden global de respuestas por pregunta. Las
    //     respuestas se canonicalizan a answer.id antes de enviarse, así que
    //     el servidor valida por id independientemente de la permutación.
    // Ambas las calcula el host al pulsar Start, se persisten en Redis y
    // llegan a cada cliente vía matchStarted (o vía setLobbyData en F5).
    orders: null,
    // License del host (paridad con el editor: 0=free, >=1=plan de pago).
    // Solo se hidrata cuando role==='host'; en el cliente del player es null.
    // Sirve para condicionar opciones premium del lobby (cambio de fondo, etc.).
    hostLicense: null,
    // Idiomas disponibles para el selector de idioma de la interfaz (opción
    // avanzada del lobby). Se inyectan en el HTML del match (actividad['match']).
    interfaceLanguages: [],
}

const multiplayerSlice = createSlice({
    initialState,
    name: 'multiplayer',
    reducers: {
        setPlayer(state, action) {
            const { token, userType } = action.payload;
            state.player = { token, userType };
        },
        getPlayer(state){
            return state.player;
        },
        initMatch(state, action) {
            // El backend embebe en el HTML del lobby toda la info de bootstrap
            // que antes pedía el fetch a /matches/lobby-data/{pin}: pin, id,
            // rol, playerId, room WS y hostLicense. Con esto + la rehidratación
            // del backlog WS no hace falta ninguna llamada HTTP de estado.
            const { pin, id, role, playerId, wsRoom, hostLicense, activityLang, activityType, interfaceLanguages } = action.payload;
            // activityLang/activityType viajan en state.match: el idioma de la
            // actividad es la base de los textos (horneados en HTML) y el tipo se
            // usa para pedir el bundle de otros idiomas. setLobbyData/matchRestarted
            // hacen spread de state.match, así que se conservan tras reconexión.
            state.match = { pin, id: id ?? null, wsRoom: wsRoom ?? null, locked: false, activityLang: activityLang ?? null, activityType: activityType ?? null };
            if (interfaceLanguages) {
                state.interfaceLanguages = interfaceLanguages;
            }
            if (role) {
                state.role = role;
            }
            if (playerId != null) {
                state.playerData = { id: String(playerId), score: 0, realScore: 0 };
            }
            // hostLicense solo viaja en el HTML del host (gates premium); en el
            // player el backend lo pone a null para no filtrar el plan del autor
            state.hostLicense = hostLicense ?? null;
        },
        setRehydrated(state) {
            state.rehydrating = false;
        },
        setLobbyData(state, action) {
            const { id, mode, status, role, players, wsLastId, wsToken, locked, question, player, questionStats, feedbackAggregates, feedbackVisible, maxRevealedPosition, playerFeedback, settings, orders, hostLicense } = action.payload;
            state.hostLicense = hostLicense ?? null;
            state.match = { ...state.match, id, mode, status, wsLastId: wsLastId || 0, wsToken, locked: locked || false };
            state.role = role;
            state.players = (players || []).map(normalizePlayer);

            // Si la partida ya no está en LOBBY, levantamos started=true para que
            // el GameProvider pinte directamente el juego en vez del lobby
            state.started = status === 'PLAYING' || status === 'RESULTS';
            state.finished = status === 'RESULTS';
            if (action.payload.ranking) {
                state.ranking = action.payload.ranking;
            }

            // Rehidratación de la posición mínima desvelada en el podio: el
            // evento positionRevealed no se reenvía tras F5, así que el backend
            // lo persiste en Redis y lo devuelve aquí (solo en RESULTS)
            state.maxRevealedPosition = (typeof maxRevealedPosition === 'number') ? maxRevealedPosition : null;

            // Histórico de stats por pregunta: lo envía el backend para que el host
            // pueda ver el resumen aunque haga F5 tras acabar la partida
            state.questionStats = questionStats && typeof questionStats === 'object' ? questionStats : {};

            // Estado de la pregunta actual: si el backend devolvió una snapshot,
            // la usamos; si no, dejamos el estado inicial.
            // Si la pregunta ya está cerrada, rehidratamos también sus stats
            // desde el histórico (answerStats no se reenvía tras reconexión)
            if (question) {
                const hydratedStats = question.phase === 'closed'
                    ? (state.questionStats[question.index] ?? null)
                    : null;
                state.question = {
                    index: question.index,
                    phase: question.phase,
                    startedAt: question.startedAt ?? null,
                    deadline: question.deadline ?? null,
                    deadlineDuration: question.deadline ? Math.max(0, question.deadline - Math.floor(Date.now() / 1000)) : null,
                    alreadyAnswered: question.alreadyAnswered ?? false,
                    playerAnswer: question.playerAnswer ?? null,
                    answeredCount: question.answeredCount ?? 0,
                    stats: hydratedStats,
                };
            } else {
                state.question = { ...initialQuestionState };
            }

            // Datos del player actual (solo para role === 'player')
            state.playerData = player || null;

            // Rehidratación del feedback post-partida: el host recibe agregados,
            // el jugador recibe si ya votó (para ocultar el formulario tras F5).
            // visible se rehidrata desde Redis para que un F5 muestre el modal
            // correcto si el host ya estaba mostrando las valoraciones
            state.feedback = {
                submitted: !!playerFeedback,
                aggregates: feedbackAggregates ?? null,
                visible: !!feedbackVisible,
            };

            // Settings y permutaciones: settings existen en cualquier estado;
            // orders solo tras empezar la partida (ver controller/match.php)
            state.settings = (settings && typeof settings === 'object' && !Array.isArray(settings))
                ? { ...settings }
                : null;
            state.orders = orders && typeof orders === 'object' ? orders : null;
        },
        setPlayers(state, action) {
            state.players = action.payload.map(normalizePlayer);
        },
        addPlayer(state, action) {
            const player = normalizePlayer(action.payload);
            const exists = state.players.find(p => p.id === player.id);
            if (!exists) {
                state.players.push(player);
            } else {
                Object.assign(exists, player);
            }
        },
        removePlayer(state, action) {
            const id = String(action.payload.id);
            state.players = state.players.filter(p => p.id !== id);
        },
        playerReconnected(state, action) {
            const incoming = normalizePlayer(action.payload);
            const player = state.players.find(p => p.id === incoming.id);
            if (player) {
                Object.assign(player, incoming);
            } else {
                state.players.push(incoming);
            }
        },
        updatePlayer(state, action) {
            const id = String(action.payload.id);
            const player = state.players.find(p => p.id === id);
            if (player) {
                Object.assign(player, action.payload);
            }
        },
        lobbyLocked(state, action) {
            if (state.match) {
                state.match.locked = action.payload.locked;
            }
        },
        matchStarted(state, action) {
            state.started = true;
            state.finished = false;
            state.ranking = [];
            state.rankingShown = false;
            state.maxRevealedPosition = null;
            state.question = { ...initialQuestionState };
            state.questionStats = {};
            // El host envía questionOrder y answerOrders globales; los
            // aplicamos en bloque para que todos los clientes vean el mismo
            // orden de preguntas y respuestas
            const payload = action?.payload;
            if (payload && (payload.questionOrder || payload.answerOrders)) {
                state.orders = {
                    questionOrder: payload.questionOrder ?? null,
                    answerOrders: payload.answerOrders ?? null,
                };
            }
        },
        settingsUpdated(state, action) {
            const { settings } = action.payload || {};
            if (settings && typeof settings === 'object') {
                state.settings = { ...state.settings, ...settings };
            }
        },
        questionStarted(state, action) {
            const { index, startedAt } = action.payload;
            state.question = {
                index,
                phase: 'answering',
                startedAt: startedAt ?? null,
                deadline: null,
                deadlineDuration: null,
                alreadyAnswered: false,
                playerAnswer: null,
                answeredCount: 0,
                stats: null,
            };
            // Al arrancar la siguiente pregunta limpiamos el flag de reveal:
            // el PlayerPointsModal volverá a esconder la posición hasta que
            // el host vuelva a entrar en RANKING tras esta pregunta
            state.rankingShown = false;
        },
        // Despachado por WebSocketProvider en cada broadcast 'playerAnswered'.
        // Cubre tres cosas que antes se hidrataban via REST setLobbyData:
        //   1. answeredCount: contador "X/N respondieron" para el host.
        //   2. Si el msg es del propio jugador: marca alreadyAnswered y guarda
        //      el payload original en playerAnswer (lo usa
        //      useMultiplayerRehydrateAnswer tras F5 para repintar el modal).
        //   3. Si el msg es del propio jugador: acumula score/realScore.
        playerAnswered(state, action) {
            const { questionIndex, playerId, answer, arcadePoints, realPoints, isCorrect } = action.payload;
            if (state.question && state.question.index === questionIndex) {
                state.question.answeredCount = (state.question.answeredCount ?? 0) + 1;
            }
            if (state.playerData && String(state.playerData.id) === String(playerId)) {
                if (state.question && state.question.index === questionIndex) {
                    state.question.alreadyAnswered = true;
                    // playerAnswer fusiona el payload original (objeto o
                    // primitivo) con los campos del resultado autoritativo —
                    // mismo formato que devolvía getLobbyData.playerAnswer
                    const payload = (answer && typeof answer === 'object' && !Array.isArray(answer))
                        ? { ...answer }
                        : { answer };
                    payload.isCorrect = !!isCorrect;
                    payload.realPoints = Number(realPoints) || 0;
                    payload.arcadePoints = Number(arcadePoints) || 0;
                    state.question.playerAnswer = payload;
                }
                state.playerData.score = (state.playerData.score ?? 0) + (Number(arcadePoints) || 0);
                state.playerData.realScore = (state.playerData.realScore ?? 0) + (Number(realPoints) || 0);
            }
        },
        answerStatsReceived(state, action) {
            const { questionIndex, totalAnswers, totalPlayers, buckets } = action.payload;
            state.questionStats[questionIndex] = { totalAnswers, totalPlayers, buckets };
            if (state.question && state.question.index === questionIndex) {
                state.question.stats = { totalAnswers, totalPlayers, buckets };
            }
        },
        questionEnded(state) {
            if (state.question) {
                state.question.phase = 'closed';
                state.question.deadline = null;
                state.question.deadlineDuration = null;
            }
        },
        questionDeadlineSet(state, action) {
            const { deadline, duration } = action.payload;
            if (state.question) {
                state.question.deadline = deadline ?? null;
                state.question.deadlineDuration = duration ?? null;
            }
        },
        setRole(state, action) {
            state.role = action.payload;
        },
        setPlayerData(state, action) {
            state.playerData = action.payload;
        },
        positionRevealed(state, action) {
            const position = action.payload.position;
            if (state.maxRevealedPosition === null || position < state.maxRevealedPosition) {
                state.maxRevealedPosition = position;
            }
        },
        matchFinished(state, action) {
            state.finished = true;
            state.ranking = action.payload.ranking || [];
            state.maxRevealedPosition = null;
            state.rankingShown = false;
            state.feedback = { ...initialFeedbackState };
        },
        // El reinicio crea una partida NUEVA (nuevo id/pin/rooms) y finaliza la
        // anterior. El payload trae { id, pin, players } donde players es el
        // mapa oldPlayerId→newPlayerId. Cambiamos match.wsRoom y playerData.id a
        // los de la partida nueva: el efecto de useMultiplayerWS reconecta solo
        // al room nuevo y la presencia se reconstruye vía connectionJoined.
        matchRestarted(state, action) {
            state.started = false;
            state.finished = false;
            state.ranking = [];
            state.rankingShown = false;
            state.maxRevealedPosition = null;
            state.question = { ...initialQuestionState };
            state.questionStats = {};
            state.feedback = { ...initialFeedbackState };
            // Conservamos los settings (el host puede volver a empezar con la
            // misma config), pero descartamos las permutaciones
            state.orders = null;

            const { id, pin, players } = action.payload || {};
            const wsRoom = state.role === 'host' ? `matchHost${id}` : `matchPlayers${id}`;
            state.match = { ...state.match, id, pin, wsRoom, locked: false };

            // El jugador adopta su nuevo playerId (mirando el mapa con su id
            // viejo) y resetea los totales a 0; el host no tiene playerData.
            if (state.playerData) {
                const newPlayerId = players?.[String(state.playerData.id)];
                state.playerData = { id: newPlayerId != null ? String(newPlayerId) : null, score: 0, realScore: 0 };
            }

            // El host reconstruye la lista de jugadores con los playerReconnected
            // que llegan al reconectar cada uno al room nuevo.
            state.players = [];

            // Dejamos la UI en blanco hasta que termine la rehidratación del
            // room nuevo (useMultiplayerWS baja rehydrating tras 500 ms de
            // silencio), evitando ver por unos ms el podio de la partida vieja.
            state.rehydrating = true;
        },
        matchFeedbackSubmitted(state) {
            state.feedback.submitted = true;
        },
        matchFeedbackAggregatesUpdated(state, action) {
            state.feedback.aggregates = action.payload;
        },
        feedbackVisibilityChanged(state, action) {
            state.feedback.visible = !!action.payload?.visible;
        },
        // Broadcast del backend tras cerrar cada pregunta. Lo recibimos ya en el
        // store del player para que el PlayerPointsModal pueda calcular su
        // posición sin esperar a un GET adicional
        rankingUpdated(state, action) {
            state.ranking = action.payload.ranking || [];
        },
        // El host ha entrado en la vista RANKING entre preguntas: a partir de
        // aquí el PlayerPointsModal del jugador puede mostrar su posición
        rankingShown(state) {
            state.rankingShown = true;
        },
        // Limpieza del payload rehidratado tras consumirlo. Lo despacha el hook
        // que repuebla state.game.questions[i].answer al detectar playerAnswer,
        // para que no se vuelva a procesar en renders posteriores
        playerAnswerConsumed(state) {
            if (state.question) {
                state.question.playerAnswer = null;
            }
        }
    }
})

export const {
    setPlayer, getPlayer, initMatch, setRehydrated, setLobbyData, setPlayers, addPlayer, removePlayer,
    playerReconnected, updatePlayer, lobbyLocked, matchStarted,
    questionStarted, questionEnded, questionDeadlineSet, answerStatsReceived, setRole,
    setPlayerData, positionRevealed, matchFinished,
    matchRestarted, matchFeedbackSubmitted, matchFeedbackAggregatesUpdated,
    settingsUpdated, feedbackVisibilityChanged, rankingUpdated, rankingShown,
    playerAnswerConsumed, playerAnswered
} = multiplayerSlice.actions

export default multiplayerSlice.reducer
