import { useCallback, useEffect, useRef, useState } from 'react';
import { useEvent, useTranslate } from '@educaplay/core/hooks';
import { Banner } from '../Banner';
import styles from './PresenceBanner.module.scss';

const DISPLAY_MS = 3000;
const EXIT_MS = 280;

// Pastilla que avisa al host de las conexiones, desconexiones y expulsiones
// durante la partida. Los eventos llegan por WS y se encolan: cada uno se
// muestra DISPLAY_MS y, tras la animación de salida del Banner (EXIT_MS),
// se saca el siguiente. Así dos cambios casi simultáneos se ven secuencialmente
// sin que se solapen ni se pierdan
export function PresenceBanner() {
    const t = useTranslate();
    const [queue, setQueue] = useState([]);
    const [current, setCurrent] = useState(null);
    const [visible, setVisible] = useState(false);
    const seqRef = useRef(0);

    const enqueue = useCallback((message) => {
        if (!message) return;
        seqRef.current += 1;
        const id = seqRef.current;
        setQueue(prev => [...prev, { id, message }]);
    }, []);

    // El backend emite playerReconnected también en la primera conexión WS de
    // cada jugador (ver matchPlayer::connectionJoined): durante la partida un
    // playerReconnected siempre es un reenganche real
    useEvent('playerJoined', useCallback((msg) => {
        const nickname = msg?.player?.nickname ?? '';
        enqueue(t('common.multiplayer.presenceBanner.connected', { nickname }));
    }, [t, enqueue]));

    useEvent('playerReconnected', useCallback((msg) => {
        const nickname = msg?.player?.nickname ?? '';
        enqueue(t('common.multiplayer.presenceBanner.connected', { nickname }));
    }, [t, enqueue]));

    useEvent('playerDisconnected', useCallback((msg) => {
        const nickname = msg?.player?.nickname ?? '';
        enqueue(t('common.multiplayer.presenceBanner.disconnected', { nickname }));
    }, [t, enqueue]));

    useEvent('playerLeft', useCallback((msg) => {
        const nickname = msg?.player?.nickname ?? '';
        enqueue(t('common.multiplayer.presenceBanner.left', { nickname }));
    }, [t, enqueue]));

    useEvent('playerKicked', useCallback((msg) => {
        const nickname = msg?.player?.nickname ?? '';
        enqueue(t('common.multiplayer.presenceBanner.kicked', { nickname }));
    }, [t, enqueue]));

    // Saca el siguiente item de la cola cuando el slot está libre
    useEffect(() => {
        if (current !== null || queue.length === 0) return;
        setCurrent(queue[0]);
        setQueue(prev => prev.slice(1));
    }, [current, queue]);

    // Al fijar current, dispara la entrada y programa la salida
    useEffect(() => {
        if (!current) return;
        setVisible(true);
        const timer = setTimeout(() => setVisible(false), DISPLAY_MS);
        return () => clearTimeout(timer);
    }, [current]);

    // Tras la animación de salida liberamos el slot para que el siguiente
    // pueda entrar limpiamente
    useEffect(() => {
        if (visible || !current) return;
        const timer = setTimeout(() => setCurrent(null), EXIT_MS);
        return () => clearTimeout(timer);
    }, [visible, current]);

    return (
        <Banner visible={visible} className={styles.presenceBanner}>
            {current?.message}
        </Banner>
    );
}
