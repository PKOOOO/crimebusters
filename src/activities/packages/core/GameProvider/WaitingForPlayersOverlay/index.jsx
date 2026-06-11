import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { useMultiplayer, useTranslate } from '@educaplay/core/hooks';
import styles from './WaitingForPlayersOverlay.module.scss';

// Overlay full-screen que aparece en la vista del host cuando se queda sin
// jugadores conectados durante la partida. Velo negro semi-transparente con
// texto blanco centrado: deja entrever el juego por detrás pero bloquea la
// interacción para que el host no manipule controles sin efecto
export function WaitingForPlayersOverlay() {
    const t = useTranslate();
    const { isHost } = useMultiplayer();
    const playersCount = useSelector(state => state.multiplayer.players.length);
    const started = useSelector(state => state.multiplayer.started);
    const finished = useSelector(state => state.multiplayer.finished);

    const visible = isHost && started && !finished && playersCount === 0;

    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    className={styles.overlay}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    <p className={styles.message}>
                        {t('common.multiplayer.host.waitingForPlayers')}
                        <span className={styles.dots} aria-hidden="true">
                            <span />
                            <span />
                            <span />
                        </span>
                    </p>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
