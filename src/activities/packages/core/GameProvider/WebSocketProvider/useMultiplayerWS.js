import { useEffect, useRef, useState, useCallback } from 'react';
import { WSClient } from '../Lobby/useWebSocketConnection';

// Ventana de silencio para considerar terminada la rehidratación. Mismo patrón
// que retos (`updateScoreTable` debouncea a 500ms en resources/js/retosWs.js):
// durante el reenvío del backlog los mensajes llegan en ráfaga; cuando hay
// REHYDRATION_IDLE_MS sin tráfico damos por hecho que el estado ya está completo
// y disparamos onRehydrated. El lobby usa esto para no pintar hasta que llegue.
const REHYDRATION_IDLE_MS = 500;

// Hook React específico del multijugador. La clase WSClient
// (useWebSocketConnection.js) es genérica y agnóstica al protocolo del
// servidor — aquí encima añadimos: (1) envío del mensaje 'join' tras open con
// connectionType='multiplayer'/room/playerId, (2) debounce de rehidratación,
// (3) helper request() que envía `{action, data}`; el matchDispatcher recibe
// estos mensajes porque el servidor enruta por connection->type fijado en el
// join.
export function useMultiplayerWS({ wsUrl, wsRoom, playerId = null, onAction, onRehydrated }) {
    const clientRef = useRef(null);
    const onActionRef = useRef(onAction);
    const onRehydratedRef = useRef(onRehydrated);
    const [connected, setConnected] = useState(false);

    // Mantenemos refs a los callbacks para que el effect no se re-ejecute al
    // cambiar el handler (que cambia en cada render). Así la conexión persiste
    // mientras wsRoom/playerId no cambien.
    useEffect(() => { onActionRef.current = onAction; }, [onAction]);
    useEffect(() => { onRehydratedRef.current = onRehydrated; }, [onRehydrated]);

    useEffect(() => {
        if (!wsUrl || !wsRoom) return undefined;
        const client = new WSClient(wsUrl);
        clientRef.current = client;

        let idleTimer = null;
        const scheduleRehydrated = () => {
            clearTimeout(idleTimer);
            idleTimer = setTimeout(() => {
                if (onRehydratedRef.current) onRehydratedRef.current();
            }, REHYDRATION_IDLE_MS);
        };

        client.on('open', () => {
            setConnected(true);
            // Tras abrir mandamos el join: el servidor no asocia la conexión
            // con un room hasta recibirlo, y no empieza a rehidratar el
            // backlog. playerId opcional: si viene activa el tracking de
            // presencia (markConnected/markDisconnected). connectionType
            // marca el propósito de la conexión para que el servidor enrute
            // los mensajes posteriores sin necesidad de mirar el type de
            // cada uno.
            const joinMessage = { type: 'join', connectionType: 'multiplayer', room: wsRoom };
            if (playerId !== null && playerId !== undefined) {
                joinMessage.playerId = playerId;
            }
            client.send(joinMessage);
            // Arrancamos el debounce ya: si el backlog está vacío (partida
            // recién creada) no llegará ningún mensaje y aún así queremos
            // liberar el render tras los 500ms de silencio.
            scheduleRehydrated();
        });
        client.on('close', () => setConnected(false));
        client.on('message', (raw) => {
            scheduleRehydrated();
            try {
                const data = JSON.parse(raw);
                if (data.type === 'message' && data.message && onActionRef.current) {
                    onActionRef.current(data.message.action, data.message);
                }
            } catch {
                // Mensaje no parseable o malformado: lo descartamos sin
                // detener el resto del flujo (la rehidratación sigue).
            }
        });

        client.start();

        // Al cambiar wsRoom/playerId (reinicio → partida nueva) o al desmontar,
        // cerramos el cliente viejo: stop() impide la reconexión automática y
        // libera el socket antes de que el efecto cree el cliente del room nuevo.
        return () => {
            clearTimeout(idleTimer);
            client.stop();
        };
    }, [wsUrl, wsRoom, playerId]);

    const send = useCallback((msg) => clientRef.current?.send(msg), []);

    // request(action, data) envuelve send con el formato que espera el
    // matchDispatcher. Es fire-and-forget: la respuesta llega como broadcast
    // a través del WS, no como retorno de la promesa. El enrutado por
    // 'multiplayer' lo decide el servidor a partir de connection->type
    // fijado en el join, así que no hace falta enviar type en cada mensaje.
    const request = useCallback((action, data = {}) => {
        clientRef.current?.send({ action, data });
        return Promise.resolve({ ok: true });
    }, []);

    return { send, request, connected };
}
