class WSClient {

    constructor(wsUrl) {
        this._ws = null;
        this._wsUrl = wsUrl;
        this._reconnectAttempts = 0;
        this._listeners = new Map();
        this._running = false;
        this._lastId = 0;
        this._outbox = [];
    }

    start() {
        if (!this._running) {
            this._running = true;
            this._connect();
        }
    }

    // Cierre definitivo: anula los handlers (para no emitir eventos tras el
    // teardown) y cierra el socket. _running=false impide que onclose programe
    // una reconexión. Lo llama el cleanup de useMultiplayerWS al cambiar de room
    // (reinicio/migración) o al desmontar, evitando dejar sockets huérfanos.
    stop() {
        this._running = false;
        if (this._ws) {
            this._ws.onopen = null;
            this._ws.onmessage = null;
            this._ws.onerror = null;
            this._ws.onclose = null;
            this._ws.close();
            this._ws = null;
        }
    }

    _connect() {
        // Conexión directa al wsUrl: sin auth y sin last_id en la query —
        // ambos se quedaron obsoletos cuando el servidor pasó al protocolo
        // tipo retos (room y last_id viajan dentro del mensaje 'join').
        this._ws = new WebSocket(this._wsUrl);
        this._ws.onopen = () => {
            this._reconnectAttempts = 0;
            this._flushOutbox();
            this._emit('open');
        };
        this._ws.onmessage = (e) => {
            this._emit('message', e.data);
            const data = JSON.parse(e.data);
            if (data.type != '_ka') {
                if (data.id > this._lastId) {
                    this._lastId = data.id;
                }
            }
        };
        this._ws.onerror = () => {
            this._emit('error');
        };
        this._ws.onclose = (e) => {
            if (!e.wasClean) {
                this._scheduleReconnect();
            }
            this._emit('close', e.code, e.reason, e.wasClean);
        };
    }

    _scheduleReconnect() {
        if (!this._running) return;
        const RECONNECT_BASE_MS = 1000;
        const RECONNECT_MAX_MS = 30000;
        const RECONNECT_FACTOR = 2;
        const RECONNECT_JITTER_MS = 250;
        const baseDelay = Math.min(RECONNECT_BASE_MS * Math.pow(RECONNECT_FACTOR, this._reconnectAttempts), RECONNECT_MAX_MS);
        const jitter = Math.floor((Math.random() * 2 - 1) * RECONNECT_JITTER_MS);
        const delay = Math.max(0, baseDelay + jitter);
        setTimeout(() => {
            this._reconnectAttempts++;
            this._connect();
        }, delay);
        this._emit('retryConnect', Math.round(delay), this._reconnectAttempts + 1);
    }

    send(message) {
        const payload = typeof message === 'string' ? message : JSON.stringify(message);
        if (this._ws && this._ws.readyState === WebSocket.OPEN) {
            this._ws.send(payload);
            this._emit('sent');
        } else {
            this._outbox.push(payload);
        }
    }

    _flushOutbox() {
        if (this._ws.readyState === WebSocket.OPEN) {
            while (this._outbox.length) {
                this._ws.send(this._outbox.shift());
            }
        }
    }

    on(eventName, handler) {
        if (!this._listeners.has(eventName)) {
            this._listeners.set(eventName, new Set());
        }
        this._listeners.get(eventName).add(handler);
        return this;
    }

    _emit(eventName, ...args) {
        if (this._listeners.has(eventName)) {
            for (const handler of this._listeners.get(eventName)) {
                handler(...args);
            }
        }
    }

}

export { WSClient };
