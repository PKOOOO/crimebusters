import { Button } from '@educaplay/core';
import { Dialog } from '@educaplay/core/components';
import { useTranslate } from '@educaplay/core/hooks';
import styles from './Lobby.module.scss';

// Estrella amarilla inline para el CTA premium. Mantiene el patrón usado por
// otros iconos locales del lobby (p.ej. IconLock en LobbyHost) y replica el
// recurso SVG_starYellow del editor sin acoplar este módulo a su bundle.
const IconStarYellow = () => (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
        <path
            d="M12 2.5l2.9 6.3 6.9.8-5.1 4.7 1.4 6.8L12 17.6 5.9 21.1l1.4-6.8L2.2 9.6l6.9-.8z"
            fill="#F5C518"
            stroke="#F5C518"
            strokeWidth="1"
            strokeLinejoin="round"
        />
    </svg>
);

// Modal que se muestra cuando el host intenta usar una opción premium del
// lobby sin tener un plan compatible. Siempre muestra un mensaje genérico
// (sin nombrar el plan actual ni el plan destino) y enlaza al checkout de
// upgrade general.
export function PremiumDialog({ open, onClose }) {
    const t = useTranslate();

    return (
        <Dialog open={open} onClose={onClose} variant="confirm" className={styles.premiumDialogContainer}>
            <div className={styles.premiumDialog}>
                <div className={styles.premiumDialogBody}>
                    <p className={styles.premiumDialogTitle}>{t('common.multiplayer.premium.title')}</p>
                    <p className={styles.premiumDialogQuestion}>{t('common.multiplayer.premium.question')}</p>
                </div>
                <div className={styles.premiumDialogFooter}>
                    <Button className={styles.premiumDialogCancel} onClick={onClose}>
                        {t('common.settings.cancel')}
                    </Button>
                    <a
                        className={styles.premiumDialogAccept}
                        href="/premium/"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        <IconStarYellow />
                        <span>{t('common.multiplayer.premium.upgrade')}</span>
                    </a>
                </div>
            </div>
        </Dialog>
    );
}
