import { createContext, useContext, useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setRole, setPlayerData } from '@educaplay/store/slices/multiplayerSlice';
import { WS_URL } from '@educaplay/core/utils/constants';
import { useWebSocket } from '@educaplay/core/hooks';
import { IS_DEV } from '../../utils';
import { Switch } from '../Switch';
import { Podium } from '../HostViewScore/Podium';
import { Triangle } from '../../Icons/Triangle';
import playersFixture from '../../services/fixtures/players.json';
import styles from './DebugWebsocketProvider.module.scss';

const COLLAPSED_STORAGE_KEY = 'educaplay_debug_collapsed';

const FakePlayersContext = createContext({
    hasFakes: () => false,
    fakeCount: () => 0,
    submitAnswerFromAllFakes: () => {},
});

export const useFakePlayers = () => useContext(FakePlayersContext);

export const DebugWebSocketProvider = ({ children }) => {

    const dispatch = useDispatch();
    const role = useSelector(state => state.multiplayer.role);
    const isHost = role === 'host';
    const serverQuestion = useSelector(state => state.multiplayer.question);
    const questions = useSelector(state => state.game.questions);
    const serverQuestionIndex = serverQuestion?.index ?? null;
    const questionPhase = serverQuestion?.phase ?? null;
    const currentQuestion = serverQuestionIndex != null ? questions?.[serverQuestionIndex] : null;
    const [showPodium, setShowPodium] = useState(false);
    const [fakeLoading, setFakeLoading] = useState(false);
    const [fakeCountState, setFakeCountState] = useState(0);
    const [collapsed, setCollapsed] = useState(() => {
        try {
            return localStorage.getItem(COLLAPSED_STORAGE_KEY) === '1';
        } catch {
            return false;
        }
    });
    const { request } = useWebSocket();
    const socketsRef = useRef([]);
    const playerData = useSelector(state => state.multiplayer.playerData);
    // Marca si hemos inyectado un playerData fake para previsualizar la vista
    // de player. Sirve para limpiarlo solo si lo pusimos nosotros y nunca pisar
    // un playerData real (p. ej. tras un F5 con una sesión de player legítima)
    const fakePlayerDataInjectedRef = useRef(false);

    const toggleRole = () => {
        const nextRole = isHost ? 'player' : 'host';
        dispatch(setRole(nextRole));

        // Al previsualizar como player, si no hay playerData real, inyectamos
        // uno fake para que LobbyPlayer lo trate como joineado y no dispare
        // el auto-join contra /matches/join/
        if (nextRole === 'player' && !playerData) {
            dispatch(setPlayerData({ id: 'debug-fake', nickname: 'Debug player', avatar: null }));
            fakePlayerDataInjectedRef.current = true;
        } else if (nextRole === 'host' && fakePlayerDataInjectedRef.current) {
            dispatch(setPlayerData(null));
            fakePlayerDataInjectedRef.current = false;
        }
    };

    const toggleCollapsed = () => {
        setCollapsed(prev => {
            const next = !prev;
            try {
                localStorage.setItem(COLLAPSED_STORAGE_KEY, next ? '1' : '0');
            } catch {
                // Ignora errores de almacenamiento (modo privado, cuota, etc.)
            }
            return next;
        });
    };

    const addFakePlayers = async () => {
        if (fakeLoading) return;
        setFakeLoading(true);
        try {
            const response = await request('joinDebugPlayers', {
                nicknames: playersFixture.map(p => p.nickname),
            });
            const players = response?.players ?? [];
            players.forEach(({ wsToken }) => {
                const ws = new WebSocket(`${WS_URL}/?token=${wsToken}&last_id=0`);
                socketsRef.current.push(ws);
            });
            setFakeCountState(socketsRef.current.length);
        } catch (e) {
            console.error('joinDebugPlayers failed', e);
        } finally {
            setFakeLoading(false);
        }
    };

    // Envía un submitAnswer por cada WS fake abierto. `pickAnswer` recibe el
    // índice del fake y devuelve el payload answer (específico del juego)
    const submitAnswerFromAllFakes = useCallback((questionIndex, pickAnswer) => {
        socketsRef.current.forEach((ws, i) => {
            if (ws.readyState !== WebSocket.OPEN) return;
            const message = {
                type: 'multiplayer',
                requestId: crypto.randomUUID(),
                action: 'submitAnswer',
                data: {
                    questionIndex,
                    answer: pickAnswer(i),
                },
            };
            ws.send(JSON.stringify(message));
        });
    }, []);

    const hasOpenFakes = () => socketsRef.current.some(ws => ws.readyState === WebSocket.OPEN);
    const canSimulateAllAnswered = questionPhase === 'answering' && fakeCountState > 0;

    // Fuerza que todos los fake players registrados envíen un submitAnswer real
    // por sus propios WebSockets, para disparar el flujo normal del backend
    // (questionEnd + answerStats + rankingUpdated)
    const simulateAllAnswered = () => {
        if (!hasOpenFakes()) {
            console.warn('[simulateAllAnswered] No hay fake players conectados. Pulsa "Add players" primero.');
            return;
        }
        if (serverQuestionIndex == null || questionPhase !== 'answering') return;

        const answers = currentQuestion?.answers ?? [];
        if (answers.length === 0) {
            console.warn('[simulateAllAnswered] El tipo de actividad actual no expone answers; no se puede generar respuesta mock.');
            return;
        }

        submitAnswerFromAllFakes(serverQuestionIndex, () => {
            const pick = answers[Math.floor(Math.random() * answers.length)];
            return pick.id;
        });
    };

    // Cerrar las WS de los fakes al desmontar: el backend detectará el cierre
    // y marcará a los players como desconectados
    useEffect(() => () => {
        socketsRef.current.forEach(ws => {
            if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
                ws.close();
            }
        });
        socketsRef.current = [];
        if (fakePlayerDataInjectedRef.current) {
            dispatch(setPlayerData(null));
            fakePlayerDataInjectedRef.current = false;
        }
    }, [dispatch]);

    // El objeto del context se memoiza para que los (futuros) consumers de
    // useFakePlayers() no se re-rendericen en cada cambio interno del provider
    // (que es muy frecuente: serverQuestion cambia con cada broadcast del WS)
    const contextValue = useMemo(() => ({
        hasFakes: () => socketsRef.current.some(ws => ws.readyState === WebSocket.OPEN),
        fakeCount: () => socketsRef.current.filter(ws => ws.readyState === WebSocket.OPEN).length,
        submitAnswerFromAllFakes,
    }), [submitAnswerFromAllFakes]);

    if (!IS_DEV) {
        return (
            <FakePlayersContext.Provider value={contextValue}>
                {children}
            </FakePlayersContext.Provider>
        );
    }

    return (
        <FakePlayersContext.Provider value={contextValue}>
            <div className={styles.root}>
                {collapsed ? (
                    <button
                        type="button"
                        className={styles.pill}
                        onClick={toggleCollapsed}
                        title="Mostrar controles de debug"
                    >
                        <span className={styles.label}>DEBUG</span>
                        <span className={styles.roleBadge}>{isHost ? 'H' : 'P'}</span>
                        {fakeCountState > 0 && (
                            <span className={styles.fakeCount}>{fakeCountState}</span>
                        )}
                        <Triangle className={`${styles.chevron} ${styles.chevronDown}`} color="currentColor" />
                    </button>
                ) : (
                    <div className={styles.bar}>
                        <div className={styles.section}>
                            <span className={styles.label}>DEBUG</span>
                            <button
                                type="button"
                                className={styles.iconButton}
                                onClick={toggleCollapsed}
                                title="Plegar"
                            >
                                <Triangle className={`${styles.chevron} ${styles.chevronUp}`} color="currentColor" />
                            </button>
                        </div>
                        <div className={styles.divider} />
                        <div className={styles.section}>
                            <span className={`${styles.roleText} ${!isHost ? styles.active : ''}`}>player</span>
                            <Switch actived={isHost} onChange={toggleRole} />
                            <span className={`${styles.roleText} ${isHost ? styles.active : ''}`}>host</span>
                        </div>
                        <div className={styles.divider} />
                        <div className={styles.section}>
                            <button
                                type="button"
                                className={styles.button}
                                onClick={addFakePlayers}
                                disabled={fakeLoading}
                            >
                                {fakeLoading ? 'Adding...' : `Add players${fakeCountState > 0 ? ` (${fakeCountState})` : ''}`}
                            </button>
                        </div>
                        <div className={styles.divider} />
                        <div className={styles.section}>
                            <button
                                type="button"
                                className={`${styles.button} ${showPodium ? styles.primary : ''}`}
                                onClick={() => setShowPodium(prev => !prev)}
                            >
                                {showPodium ? 'Hide Podium' : 'Show Podium'}
                            </button>
                        </div>
                        <div className={styles.divider} />
                        <div className={styles.section}>
                            <button
                                type="button"
                                className={styles.button}
                                onClick={simulateAllAnswered}
                                disabled={!canSimulateAllAnswered}
                                title={canSimulateAllAnswered ? 'Enviar submitAnswer de todos los fakes' : 'Requiere fakes conectados y pregunta abierta'}
                            >
                                Simulate all answered
                            </button>
                        </div>
                    </div>
                )}
            </div>
            {showPodium && <Podium />}
            {children}
        </FakePlayersContext.Provider>
    );
};

export default DebugWebSocketProvider;
