import { memo } from 'react';
import { motion } from 'framer-motion';
import { Wrong } from '@educaplay/core/Icons/Wrong';
import { getInitials, getAvatarColor, resolveAvatarSrc } from '@educaplay/core/utils';
import { useTranslate } from '@educaplay/core/hooks';
import styles from './Lobby.module.scss';

const cardVariants = {
    hidden:  { opacity: 0, scale: 0.85, y: 12 },
    visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } },
    exit:    { opacity: 0, scale: 0.85, transition: { duration: 0.2, ease: 'easeIn' } },
};

function PlayerCardComponent({ player, isHost, onKick }) {
    const t = useTranslate();
    const avatarSrc = resolveAvatarSrc(player.avatar, player.photo);

    return (
        <motion.div
            className={styles.playerCard}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            layout
        >
            <div className={styles.playerCardAvatar}>
                {avatarSrc ? (
                    <img src={avatarSrc} alt={player.nickname} />
                ) : (
                    <div
                        className={styles.playerCardAvatarPlaceholder}
                        style={{ backgroundColor: getAvatarColor(player.nickname) }}
                    >
                        {getInitials(player.nickname)}
                    </div>
                )}
                <span className={styles.playerCardAvatarStatus} aria-hidden="true" />
            </div>
            <span className={styles.playerCardName}>{player.nickname || t('common.multiplayer.lobby.playerFallback')}</span>
            {isHost && onKick && (
                <button
                    type="button"
                    className={styles.playerCardKick}
                    onClick={() => onKick(player.id)}
                    aria-label={t('common.multiplayer.kick.playerAria')}
                    title={t('common.multiplayer.kick.playerTitle')}
                >
                    <Wrong />
                </button>
            )}
        </motion.div>
    );
}

// Memoizamos: cuando entra/sale un jugador en el lobby, el array `players` cambia
// pero la mayoría de objetos `player` son los mismos por referencia gracias a
// Immer/RTK. Sin memo, framer-motion recalcula `layout` en todas las tarjetas;
// con memo solo se re-renderiza la que realmente cambió.
export const PlayerCard = memo(PlayerCardComponent);
