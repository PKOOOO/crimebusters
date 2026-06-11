import { useMemo } from "react";
import { useSelector } from "react-redux";
import clsx from "clsx";
import { useTranslate } from "@educaplay/core/hooks";
import { orderBucketsByDisplay } from "@educaplay/core/utils";
import { Report } from "../../../Icons/Report";
import { AnswerCorrect } from "../../../Icons/AnswerCorrect";
import { AnswerIncorrect } from "../../../Icons/AnswerIncorrect";
import { Question } from "../../../Icons/Question";
import { ScorePanelHeader } from "../ScorePanelHeader";
import styles from "./Summary.module.scss";

const OPTION_LETTERS = ["A", "B", "C", "D", "E", "F", "G", "H"];

function QuestionBlock({ index, questionText, stats, answers }) {
    const t = useTranslate();
    // Reordenamos los buckets (canónicos) al orden en que se mostraron las
    // respuestas para que la letra A/B/C coincida con la posición real
    const buckets = orderBucketsByDisplay(stats?.buckets ?? [], answers);
    const totalAnswers = stats?.totalAnswers ?? 0;
    const totalPlayers = stats?.totalPlayers ?? 0;

    return (
        <div className={styles.questionBlock}>
            <div className={styles.questionHeader}>
                <span className={styles.questionNumber}>{index + 1}</span>
                <span className={styles.questionIcon}>
                    <Question />
                </span>
                <span className={styles.questionText}>{questionText}</span>
                <span className={styles.questionAnswers}>{t('common.multiplayer.stats.answers', { count: totalAnswers, total: totalPlayers })}</span>
            </div>

            <div className={styles.chart}>
                {buckets.map((bucket, optionIndex) => {
                    const sharePercent = totalAnswers > 0
                        ? Math.round((bucket.count / totalAnswers) * 100)
                        : 0;
                    return (
                        <div
                            key={bucket.key}
                            className={clsx(styles.column, bucket.isCorrect ? styles.correct : styles.incorrect)}
                        >
                            <div className={styles.barArea}>
                                <div className={styles.barCount}>{bucket.count}</div>
                                <div className={styles.bar} style={{ height: `${sharePercent}%` }} />
                            </div>
                            <div className={styles.badgeRow}>
                                <div className={styles.badge}>
                                    {OPTION_LETTERS[optionIndex] ?? bucket.key}
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
        </div>
    );
}

export function Summary({ title, backgroundImage }) {
    const t = useTranslate();
    const questionStats = useSelector(state => state.multiplayer.questionStats);
    const questions = useSelector(state => state.game.questions);
    const containerStyle = backgroundImage
        ? { backgroundImage: `url(${backgroundImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }
        : undefined;

    const entries = useMemo(() => {
        return questions
            .map((question, index) => ({
                index,
                question,
                stats: questionStats[index] ?? null,
            }))
            .filter(entry => entry.stats && Array.isArray(entry.stats.buckets) && entry.stats.buckets.length > 0);
    }, [questions, questionStats]);

    return (
        <div className={styles.container} style={containerStyle}>
            <ScorePanelHeader title={title} subtitle={t('common.multiplayer.summary.title')} SubtitleIcon={Report} />

            <div className={styles.content}>
                {entries.length === 0 ? (
                    <div className={styles.empty}>{t('common.multiplayer.summary.empty')}</div>
                ) : (
                    entries.map(({ index, question, stats }) => (
                        <QuestionBlock
                            key={index}
                            index={index}
                            questionText={question?.bank?.text || question?.text || ""}
                            stats={stats}
                            answers={question?.answers}
                        />
                    ))
                )}
            </div>
        </div>
    );
}
