import { SwipeableDrawer } from "@educaplay/core/components";
import classes from './FeedbackDialog.module.scss'
import clsx from 'clsx';
import { useGameSounds, useTranslate } from "@educaplay/core/hooks";
import { Button } from "@educaplay/core/components";
import { useEffect, useRef, useState } from "react";
import { NAME_SOUND_ACTIVE_BANK, NAME_SOUND_HOVER, } from "../../utils";

export function FeedbackDialog(props) {
    const { open, onClose, question } = props;

    const t = useTranslate();
    const [currentQuestion, setCurrentQuestion] = useState(question);
    const gameSound = useGameSounds();
    const isFirstRender = useRef(true);
    const titleMsg = open ? t('specific.explanation') : '';

    useEffect(() => {
        setCurrentQuestion(question)
    }, [question])

    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }
        gameSound.play(NAME_SOUND_ACTIVE_BANK)
    }, [open, gameSound])

    return (
        <SwipeableDrawer open={open} onClose={onClose}>
            <div className={classes.infoContainer} onClick={(e) => e.stopPropagation()}>
                <div className={clsx(classes.disposition, classes.dispositionWithoutImage)}>
                    <div className={classes.titleanddescriptioncontainer}>
                        <div className={classes.titleContainer}>
                            {titleMsg}
                        </div>
                    </div>
                </div>
                <div className={clsx(classes.explanationContainer, classes.scrollbar)}>
                    <p>{currentQuestion?.feedback}</p>
                </div>
                <div className={classes.ButtonContainer}>
                    <Button className={classes.btnaccept} onClick={onClose} onMouseEnter={() => gameSound.play(NAME_SOUND_HOVER)}>{t("common.settings.accept")}</Button>
                </div>
            </div>
        </SwipeableDrawer>
    );
}