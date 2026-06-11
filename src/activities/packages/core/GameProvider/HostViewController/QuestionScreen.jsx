import styles from "./QuestionScreen.module.scss";
import { CountdownLoading } from "../CountdownLoading";
import { Banner } from "../Banner";
import { assetsUrl } from "../../utils";
import { useMatchBackground, useTranslate } from "@educaplay/core/hooks";

const defaultBgImage = assetsUrl("common/background.png");

export function QuestionScreen({ questionNumber, totalQuestions, countdownSeconds, onCountdownFinish, gameImage }) {
    const t = useTranslate();
    const customBg = useMatchBackground();
    const bgImage = customBg?.src || defaultBgImage;

    return (
        <div className={styles.container} style={{ backgroundImage: `url(${bgImage})` }}>
            {gameImage && (
                <img src={gameImage} alt="" className={styles.activityLogo} />
            )}
            <Banner visible className={styles.counterBanner}>
                {t('common.multiplayer.host.questionCounter', { current: questionNumber, total: totalQuestions })}
            </Banner>
            <div className={styles.content}>
                <CountdownLoading
                    key={questionNumber}
                    initialCount={countdownSeconds}
                    onCountdownEnd={onCountdownFinish}
                    size="small"
                />
            </div>
        </div>
    );
}
