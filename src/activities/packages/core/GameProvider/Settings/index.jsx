import { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import clsx from 'clsx'
import { motion, AnimatePresence } from 'framer-motion'
import { useSelector, useDispatch } from 'react-redux';

import { Options } from '@educaplay/core/Icons/Options';
import { Sound } from '@educaplay/core/Icons/Sound';
import { Contract } from '@educaplay/core/Icons/Contract';
import { Expand } from '@educaplay/core/Icons/Expand';
import { Information } from '@educaplay/core/Icons/Information';
import { Exit } from '@educaplay/core/Icons/Exit'
import { useGameSounds, useTranslate, Button } from '@educaplay/core';
import { useMultiplayer } from '@educaplay/core/hooks';
import { SCREENS } from '@educaplay/store/constants';

import { Accordion } from '../Accordion';
import { Setting } from './Setting';
import { Dialog } from "@educaplay/core/components";
import classes from './Settings.module.scss'
import { finishGame } from '@educaplay/store/slices/gameSlice';
import { leaveMatch } from '@educaplay/core/services/multiplayer';

/**
 * @param {boolean} open - indicates if it has to be shown or not.
 * @param {function} onClose - function that is responsible for changing the state of show.
 * @returns {React.ReactNode} - return Settings Screen. 
 */

export function Settings(props) {
    const { open, onClose } = props;

    const gameSounds = useGameSounds();
    const [seetingsShow, setSeetingsShow] = useState(false);
    const [messageShow, setMessageShow] = useState(false);
    const t = useTranslate();
    const screen = useSelector(state => state.game.view);
    const [openDialogSound, setOpenDialogSound] = useState(false);
    const [openDialogAbandon, setOpenDialogAbandon] = useState(false);
    const inputRef = useRef();
    const dispatch = useDispatch();
    const { isMultiplayer } = useMultiplayer();

    const handleClickAbandonButtom = async () => {
        onClose()
        setOpenDialogAbandon(false);

        if (isMultiplayer) {
            // En multi, el jugador debe notificar al backend para que el host
            // no le siga esperando en la pregunta abierta, y se redirige al
            // home en vez de mostrar PlayerPostGame (que mostraría "esperando
            // posiciones" porque el ranking todavía no existe).
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

    const handleshowsettings = () => {
        setSeetingsShow(!seetingsShow)
        if (messageShow) setMessageShow(!messageShow)

    }
    const handleshowmessage = () => {
        setMessageShow(!messageShow)
        if (seetingsShow) setSeetingsShow(!seetingsShow)
    }

    const handleClickOutSetting = () => {
        onClose();
    }

    const handleChangeGeneralEffects = (element) => {
        element.target.checked ? gameSounds.setSoundActive(true) : gameSounds.setSoundActive(false);
    }

    const handleChangespecificAudios = () => {

        if (!inputRef.current.checked)
            setOpenDialogSound(true);
        else
            gameSounds.setSpecificSoundActive(true);


    }

    const closeDialogHandler = () => {
        if (openDialogSound) setOpenDialogSound(false);
        if (openDialogAbandon) setOpenDialogAbandon(false);
    }

    const acceptChangeHandler = () => {
        inputRef.current.checked = false;
        inputRef.current.checked ? gameSounds.setSpecificSoundActive(true) : gameSounds.setSpecificSoundActive(false);
        setOpenDialogSound(false);
    }

    useEffect(() => {

        const handleKeyDown = (event) => {

            if (event.keyCode === 27) {
                onClose();
            }
        }

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);

        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);




    return (
        <>
            <Dialog open={openDialogAbandon} onClose={() => setOpenDialogAbandon(false)} variant="confirm">
                <div className={classes.modal}>
                    <div className={classes.modalHeader}>
                        <p>{t("common.game.abandon")}</p>
                    </div>
                    <div className={classes.modalFooter}>
                        <Button className={classes.btnCancel} onClick={closeDialogHandler}>{t("common.settings.cancel")}</Button>
                        <Button className={classes.btnAccept} onClick={handleClickAbandonButtom}>{t("common.settings.accept")}</Button>
                    </div>
                </div>
            </Dialog>

            <Dialog open={openDialogSound} onClose={() => setOpenDialogSound(false)} variant="confirm">
                <div className={classes.modal}>
                    <div className={classes.modalHeader}>
                        <p>{t("common.settings.disableSounds")}</p>
                    </div>
                    <div className={classes.modalFooter}>
                        <Button className={classes.btnCancel} onClick={closeDialogHandler}>{t("common.settings.cancel")}</Button>
                        <Button className={classes.btnAccept} onClick={acceptChangeHandler}>{t("common.settings.accept")}</Button>
                    </div>
                </div>
            </Dialog>

            {/* banckground oscurecido */}

            <AnimatePresence initial={false}>
                {open && (
                    <motion.div className={classes.background}
                        onClick={handleClickOutSetting}
                        style={{ display: open ? '' : 'none' }}
                        animate={{ opacity: ['0%', '100%'] }}
                        transition={{ duration: 0.4 }}
                        exit={{ opacity: "0%" }}
                    />
                )}
            </AnimatePresence>


            {/* menu de settings */}

            <motion.div
                className={classes.container}
                animate={{ x: open ? ['100%', '-2%', '0%'] : '100%' }}
                initial={{ x: '100%' }}
                transition={{
                    duration: 0.4,
                    ease: "easeIn",
                    times: [0, 0.7, 1]
                }}>

                <div className={classes.gameoptionscontainer}>
                    <div className={classes.decoration} />
                    <div className={classes.decorationBack} />
                    <div className={classes.gameoptionsdropdown}>
                        <div className={classes.gameoptionstitle}>
                            <div className={classes.gameoptionsicon}>
                                <Options />
                            </div>

                            <div className={classes.gameoptionstext}>
                                <h1>{t("common.settings.title")}</h1>
                            </div>
                        </div>
                        <div className={classes.gamedropdowwrapper}>
                            <div className={classes.gamedropdownitemheader}>
                                <div className={classes.gamedropdowntitleh4} onClick={handleshowsettings}>
                                    <div className={seetingsShow ? classes.gamecontainericonactived : classes.gameiconcontent}>
                                        <Sound className={classes.gameiconsound} />
                                    </div>
                                    <div className={classes.gamedropdowtitle}>
                                        <h2>{t("common.settings.sound")}</h2>
                                    </div>

                                </div>
                                <div className={classes.gamedropdownheaderexpand} onClick={handleshowsettings}>
                                    <div className={classes.gameiconcontract}>
                                        {seetingsShow ? <Contract className={classes.gameiconcontract} /> : <Expand className={classes.gameiconcontract} />}
                                    </div>
                                </div>
                            </div>

                            <Accordion show={seetingsShow} className={classes.motion}>
                                <Setting Settingmsg={t("common.settings.generalEffects")} onChange={handleChangeGeneralEffects} actived={gameSounds.soundActive} />
                                <Setting Settingmsg={t("common.settings.specificAudios")} onChange={handleChangespecificAudios} actived={gameSounds.specificSoundActive} inputRef={inputRef} />
                            </Accordion>

                            <div className={classes.gamedropdownitemheader}>
                                <div className={classes.gamedropdowntitleh4} onClick={handleshowmessage}>
                                    <div className={messageShow ? classes.gamecontainericonactived : classes.gameiconcontent}>
                                        <div className={classes.gameiconinfo}>
                                            <Information className={classes.gameiconinfo} />
                                        </div>
                                    </div>
                                    <div className={classes.gamedropdowtitle} >
                                        <h2>{t("common.settings.info")}</h2>
                                    </div>
                                </div>
                                <div className={classes.gamedropdownheaderexpand} onClick={handleshowmessage}>
                                    <div className={classes.gameiconcontract}>
                                        {messageShow ? <Contract /> : <Expand />}
                                    </div>
                                </div>
                            </div>

                            <Accordion show={messageShow} className={clsx(classes.gamedropdownitembodytxt, classes.scrollbar)}>
                                <div dangerouslySetInnerHTML={{ __html: t('specific.info_html') }} className={classes.contentHtml} />
                            </Accordion>

                        </div>

                        {screen === SCREENS.GAME && (
                            <Button icon={<Exit />} className={classes.buttonExit} onClick={() => { setOpenDialogAbandon(true) }}>{t("common.settings.abandon")}</Button>
                        )}
                    </div>
                </div>

            </motion.div >

        </>
    );

}

Setting.propTypes = {
    gameData: PropTypes.string,
    show: PropTypes.bool,
    setShow: PropTypes.func,
    onFinishGame: PropTypes.func
}