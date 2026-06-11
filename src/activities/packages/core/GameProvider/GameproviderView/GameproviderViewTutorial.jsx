import classes from './GameproviderView.module.scss';
import { useEffect, useState } from "react";

export default function GameproviderViewTutorial (props) {
    const {imageSource, onClose, delay, duration} = props;
    const [showTutorial, setShowTutorial] = useState(false);

    useEffect(() => {
        const timerId = setTimeout(() => {
            setShowTutorial(true);
        }, delay);

        return () => clearTimeout(timerId);
    }, [showTutorial, delay]);

    useEffect(()=> {
        if (!showTutorial) return;
        const timerId = setTimeout(() => {
            onClose();
        }, duration);

        return () => clearTimeout(timerId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [duration, showTutorial])

    if (!showTutorial) return null;

    return (
        <div className={classes.tutorialScreen} onClick={onClose}>
            <img className={classes.tutorialImage} src={imageSource} alt="" />
        </div>
    )
}