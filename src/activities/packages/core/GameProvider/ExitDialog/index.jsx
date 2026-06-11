import { useState, useEffect } from 'react';
import { useTranslate, useMultiplayer } from '@educaplay/core/hooks'
import { useSelector } from 'react-redux';
import { SCREENS } from '@educaplay/store/constants';

import classes from './ExitDialog.module.scss'
import { Button } from '@educaplay/core';
import { Dialog } from "@educaplay/core/components";
import { finishGame } from '@educaplay/store/slices/gameSlice';
import { leaveMatch } from '@educaplay/core/services/multiplayer';
import { useDispatch } from 'react-redux';

export function ExitDialog() {
    const [open, setOpen] = useState(false);
    const t = useTranslate();
    const isOpen = useSelector(state => state.settings.isOpen);
    const screen = useSelector(state => state.game.view);
    const dispatch = useDispatch();
    const { isMultiplayer } = useMultiplayer();

    const closeDialog = () => {
        setOpen(false);
    }

    const abandonActivity = async () => {
        setOpen(false);

        if (isMultiplayer) {
            // En multi notificamos al backend para que el host no espere a
            // este jugador y redirigimos al home en vez de mostrar
            // PlayerPostGame con "esperando posiciones".
            try {
                await leaveMatch();
            } catch (e) {
                // Si el WS ya estaba cerrado, el grace period del backend cubrirá la desconexión
            }
            window.location.href = window.__EDUCAPLAY_MAIN_URL;
            return;
        }

        dispatch(finishGame());
    }

    useEffect(() => {
        if(screen === SCREENS.SCORE_SCREEN) return;
        
        const handleKeyDown = (event) => {
            if (event.keyCode === 27 && !isOpen) {
                setOpen(true);
            }
        }
    
        window.addEventListener('keydown', handleKeyDown);
    
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        }
    
    }, [screen, isOpen]);
    
    
    return (
        <Dialog open={open} onClose={() => setOpen(false)} variant="confirm">
            <div className={classes.modal}>
            <div className={classes.modalHeader}>
                <p>{t("common.game.abandon")}</p>
            </div>
            <div className={classes.modalFooter}>
                <Button className={classes.btnCancel} onClick={closeDialog}>{t("common.settings.cancel")}</Button>
                <Button className={classes.btnAccept} onClick={abandonActivity}>{t("common.settings.accept")}</Button>
            </div>
            </div>
        </Dialog>
    )
}

export default ExitDialog

