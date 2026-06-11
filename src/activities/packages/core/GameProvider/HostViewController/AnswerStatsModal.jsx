import { motion } from "framer-motion";
import { useTranslate } from "@educaplay/core/hooks";
import { orderBucketsByDisplay } from "@educaplay/core/utils";
import { AnswerCorrect } from "@educaplay/core/Icons/AnswerCorrect";
import { AnswerIncorrect } from "@educaplay/core/Icons/AnswerIncorrect";
import { Question } from "@educaplay/core/Icons/Question";
import styles from "./AnswerStatsModal.module.scss";

const OPTION_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

// El modal entra desde abajo y sale hacia abajo; el overlay solo hace fade.
// Combinado con AnimatePresence mode="wait" del HostViewController, da 400 ms
// de exit + 400 ms de entrada del modal de ranking (800 ms totales)
const MODAL_TRANSITION = { duration: 0.4, ease: "easeOut" };

export function AnswerStatsModal({ stats, question, questionNumber, totalQuestions }) {
    const t = useTranslate();
    // Reordenamos los buckets (canónicos) al orden en que se mostraron las
    // respuestas para que la letra A/B/C coincida con la posición real
    const buckets = orderBucketsByDisplay(stats?.buckets ?? [], question?.answers);
    const totalAnswers = stats?.totalAnswers ?? 0;
    const totalPlayers = stats?.totalPlayers ?? 0;
    const questionText = question?.text ?? null;

    return (
        <motion.div
            className={styles.overlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={MODAL_TRANSITION}
        >
            <motion.div
                className={styles.modal}
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={MODAL_TRANSITION}
            >
                <div className={styles.heading}>
                    <div className={styles.headingHd}>
                        <span className={styles.headingIcon}>%</span>
                        <span className={styles.headingTxt}>{t('common.multiplayer.stats.title')}</span>
                    </div>
                    {questionNumber && totalQuestions && (
                        <span className={styles.headingCounter}>
                            {t('common.multiplayer.host.questionCounter', { current: questionNumber, total: totalQuestions })}
                        </span>
                    )}
                </div>
                {questionText && (
                    <div className={styles.questionHeading}>
                        <div className={styles.questionHeadingHd}>
                            <span className={styles.questionHeadingIcon}>
                                <Question />
                            </span>
                            <span className={styles.questionHeadingTxt}>{questionText}</span>
                            <span className={styles.questionAnswers}>{t('common.multiplayer.stats.answers', { count: totalAnswers, total: totalPlayers })}</span>
                        </div>
                    </div>
                )}
                <div className={styles.chart}>
                    {buckets.map((bucket, index) => {
                        const sharePercent = totalAnswers > 0
                            ? Math.round((bucket.count / totalAnswers) * 100)
                            : 0;
                        const columnClass = `${styles.column} ${bucket.isCorrect ? styles.correct : styles.incorrect}`;
                        return (
                            <div key={bucket.key} className={columnClass}>
                                <div className={styles.barArea}>
                                    <div className={styles.barCount}>{bucket.count}</div>
                                    <div
                                        className={styles.bar}
                                        style={{ height: `${sharePercent}%` }}
                                    />
                                </div>
                                <div className={styles.badgeRow}>
                                    <div className={styles.badge}>
                                        {OPTION_LETTERS[index] ?? bucket.key}
                                    </div>
                                    <div className={styles.percent}>{sharePercent}%</div>
                                </div>
                                {bucket.label && (
                                    <div className={styles.label} title={bucket.label}>
                                        {bucket.isCorrect
                                            ? <AnswerCorrect className={styles.labelIcon} />
                                            : <AnswerIncorrect className={styles.labelIcon} />}
                                        <span className={styles.labelText}>{bucket.label}</span>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </motion.div>
        </motion.div>
    );
}
