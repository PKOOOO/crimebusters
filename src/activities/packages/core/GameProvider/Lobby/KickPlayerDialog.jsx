import { useState, useEffect } from 'react';
import { Button } from '@educaplay/core';
import { Dialog } from '@educaplay/core/components';
import { useTranslate } from '@educaplay/core/hooks';
import styles from './Lobby.module.scss';

export function KickPlayerDialog({ open, nickname, onCancel, onConfirm }) {
    const t = useTranslate();
    const [dontAskAgain, setDontAskAgain] = useState(false);

    // Resetea el checkbox cada vez que se abre el modal para evitar arrastrar
    // el estado entre expulsiones distintas
    useEffect(() => {
        if (open) setDontAskAgain(false);
    }, [open]);

    const handleConfirm = () => {
        onConfirm(dontAskAgain);
    };

    // Sustituimos %nickname% manualmente para poder envolver el nick en <strong>
    const titleParts = t('common.multiplayer.kick.title').split('%nickname%');

    return (
        <Dialog open={open} onClose={onCancel} variant="confirm">
            <div className={styles.kickDialog}>
                <div className={styles.kickDialogHeader}>
                    <p>
                        {titleParts[0]}<strong>{nickname}</strong>{titleParts[1] ?? ''}
                    </p>
                </div>
                <div className={styles.kickDialogFooter}>
                    <Button className={styles.kickDialogCancel} onClick={onCancel}>
                        {t('common.settings.cancel')}
                    </Button>
                    <Button className={styles.kickDialogAccept} onClick={handleConfirm}>
                        {t('common.multiplayer.kick.confirm')}
                    </Button>
                </div>
                <label
                    className={styles.kickDialogOption}
                    onClick={(e) => e.stopPropagation()}
                >
                    <input
                        type="checkbox"
                        checked={dontAskAgain}
                        onChange={(e) => setDontAskAgain(e.target.checked)}
                    />
                    <span>{t('common.multiplayer.kick.dontAskAgain')}</span>
                </label>
            </div>
        </Dialog>
    );
}
