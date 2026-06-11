import { Button } from '@educaplay/core';
import { Dialog } from '@educaplay/core/components';
import { useTranslate } from '@educaplay/core/hooks';
import classes from './MultiplayerExitDialog.module.scss';

export function MultiplayerExitDialog({ open, onCancel, onConfirm }) {
    const t = useTranslate();

    return (
        <Dialog open={open} onClose={onCancel} variant="confirm">
            <div className={classes.modal}>
                <div className={classes.modalHeader}>
                    <p>{t('common.multiplayer.exitConfirm.title')}</p>
                </div>
                <div className={classes.modalFooter}>
                    <Button className={classes.btnCancel} onClick={onCancel}>
                        {t('common.settings.cancel')}
                    </Button>
                    <Button className={classes.btnAccept} onClick={onConfirm}>
                        {t('common.settings.accept')}
                    </Button>
                </div>
            </div>
        </Dialog>
    );
}

export default MultiplayerExitDialog;
