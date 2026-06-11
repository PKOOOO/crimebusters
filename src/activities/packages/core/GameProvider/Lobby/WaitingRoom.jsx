import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslate } from '@educaplay/core/hooks';
import { PlayerCard } from './PlayerCard';
import styles from './Lobby.module.scss';

const gridVariants = {
    hidden:  {},
    visible: { transition: { staggerChildren: 0.05, delayChildren: 0.1 } },
};

// SVG inline (mismo patrón que IconLock en LobbyHost: se promoverá a icono
// reutilizable cuando el diseño esté aprobado)
const IconPlayer = () => (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
    </svg>
);

export function WaitingRoom({ isHost, onKickPlayer }) {
    const t = useTranslate();
    const players = useSelector(state => state.multiplayer.players);

    return (
        <div className={styles.waitingRoom}>
            <div className={styles.waitingRoomHeader}>
                <span className={styles.waitingRoomCount}>
                    <IconPlayer />
                    {players.length} {t('common.multiplayer.lobby.playersCount')}
                </span>
            </div>
            <motion.div className={styles.waitingRoomGrid} variants={gridVariants}>
                <AnimatePresence>
                    {players.map(player => (
                        <PlayerCard
                            key={player.id}
                            player={player}
                            isHost={isHost}
                            onKick={onKickPlayer}
                        />
                    ))}
                </AnimatePresence>
            </motion.div>
        </div>
    );
}
