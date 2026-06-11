import { useContext, useEffect, useRef, useState } from 'react';
import { useTranslate } from '@educaplay/core/hooks';
import { Dialog } from '@educaplay/core/components';
import { WebSocketContext } from '../WebSocketProvider/WebSocketContext';
import classes from './ConnectionLostModal.module.scss';

// Margen para evitar abrir el modal en blips de red muy cortos donde
// la reconexión sucede de forma casi inmediata
const SHOW_DELAY_MS = 2000;

export function ConnectionLostModal() {
    const t = useTranslate();
    const ctx = useContext(WebSocketContext);
    const connected = ctx?.connected ?? true;
    const hasBeenConnectedRef = useRef(false);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (connected) {
            hasBeenConnectedRef.current = true;
            setVisible(false);
            return;
        }
        // No mostramos el modal hasta que haya habido una conexión previa,
        // así evitamos un falso positivo durante la conexión inicial
        if (!hasBeenConnectedRef.current) return;
        const timerId = setTimeout(() => setVisible(true), SHOW_DELAY_MS);
        return () => clearTimeout(timerId);
    }, [connected]);

    const handleReload = () => {
        window.location.reload();
    };

    // onClose es no-op: la conexión es crítica y solo debe cerrarse al
    // recuperarse o al recargar la página manualmente
    return (
        <Dialog open={visible} onClose={() => {}} variant="confirm" className={classes.dialog}>
            <div className={classes.modal}>
                <div className={classes.modalHeader}>
                    <p>{t('common.multiplayer.connectionLost.title')}</p>
                </div>
                <div className={classes.modalBody}>
                    <p>{t('common.multiplayer.connectionLost.message')}</p>
                </div>
                <div className={classes.modalFooter}>
                    <button type="button" className={classes.reloadButton} onClick={handleReload}>
                        {t('common.multiplayer.connectionLost.reload')}
                    </button>
                </div>
            </div>
        </Dialog>
    );
}

export default ConnectionLostModal;
