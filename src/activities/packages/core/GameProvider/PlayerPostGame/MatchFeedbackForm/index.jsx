import { useState, useCallback } from "react";
import { useDispatch } from "react-redux";
import clsx from "clsx";
import { submitMatchFeedback, skipMatchFeedback } from "@educaplay/core/services/multiplayer";
import { matchFeedbackSubmitted } from "@educaplay/store/slices/multiplayerSlice";
import { trackError } from "@educaplay/core/utils";
import { useTranslate } from "@educaplay/core/hooks";
import { FeedbackUp } from "../../../Icons/FeedbackUp";
import { FeedbackDown } from "../../../Icons/FeedbackDown";
import styles from "./MatchFeedbackForm.module.scss";

function StarRatingInput({ value, onChange }) {
    const t = useTranslate();
    const [hover, setHover] = useState(0);

    return (
        <div className={styles.starRow}>
            {[1, 2, 3, 4, 5].map(n => {
                const filled = n <= (hover || value);
                return (
                    <button
                        key={n}
                        type="button"
                        className={clsx(styles.starButton, filled && styles.starButtonFilled)}
                        onClick={() => onChange(n)}
                        onMouseEnter={() => setHover(n)}
                        onMouseLeave={() => setHover(0)}
                        aria-label={t('common.multiplayer.feedbackForm.starsAria', { count: n })}
                    >
                        <svg viewBox="0 12.705 512 486.59" width="36" height="36">
                            <polygon points="256.814,12.705 317.205,198.566 512.631,198.566 354.529,313.435 414.918,499.295 256.814,384.427 98.713,499.295 159.102,313.435 1,198.566 196.426,198.566" />
                        </svg>
                    </button>
                );
            })}
        </div>
    );
}

function ThumbsChoice({ value, onChange }) {
    const t = useTranslate();
    return (
        <div className={styles.thumbsRow}>
            <button
                type="button"
                className={clsx(styles.thumbButton, value === 1 && styles.thumbButtonSelected)}
                onClick={() => onChange(1)}
                aria-label={t('common.multiplayer.feedbackForm.thumbUp')}
            >
                <FeedbackUp className={styles.thumbSvg} />
            </button>
            <button
                type="button"
                className={clsx(styles.thumbButton, value === 0 && styles.thumbButtonSelected)}
                onClick={() => onChange(0)}
                aria-label={t('common.multiplayer.feedbackForm.thumbDown')}
            >
                <FeedbackDown className={styles.thumbSvg} />
            </button>
        </div>
    );
}

export function MatchFeedbackForm() {
    const t = useTranslate();
    const dispatch = useDispatch();
    const [gameStars, setGameStars] = useState(0);
    const [learningLike, setLearningLike] = useState(null);
    const [recommendLike, setRecommendLike] = useState(null);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState(false);

    const handleSkip = useCallback(async () => {
        if (sending) return;
        setSending(true);
        setError(false);
        try {
            await skipMatchFeedback();
            dispatch(matchFeedbackSubmitted());
        } catch (e) {
            trackError(e);
            setError(true);
            setSending(false);
        }
    }, [sending, dispatch]);

    const handleSubmit = useCallback(async () => {
        if (gameStars < 1 || sending) return;
        setSending(true);
        setError(false);
        try {
            await submitMatchFeedback({ gameStars, learningLike, recommendLike });
            dispatch(matchFeedbackSubmitted());
        } catch (e) {
            trackError(e);
            setError(true);
            setSending(false);
        }
    }, [gameStars, learningLike, recommendLike, sending, dispatch]);

    const canSubmit = gameStars >= 1 && !sending;

    return (
        <div className={styles.container}>
            <div className={styles.question}>
                <div className={styles.questionTitle}>{t('common.multiplayer.feedback.gameRating')}</div>
                <StarRatingInput value={gameStars} onChange={setGameStars} />
            </div>

            <div className={styles.question}>
                <div className={styles.questionTitle}>{t('common.multiplayer.feedback.learning')}</div>
                <ThumbsChoice value={learningLike} onChange={setLearningLike} />
            </div>

            <div className={styles.question}>
                <div className={styles.questionTitle}>{t('common.multiplayer.feedback.recommend')}</div>
                <ThumbsChoice value={recommendLike} onChange={setRecommendLike} />
            </div>

            <div className={styles.actions}>
                <button
                    type="button"
                    className={styles.submitButton}
                    onClick={handleSubmit}
                    disabled={!canSubmit}
                >
                    {t('common.multiplayer.feedbackForm.submit')}
                </button>
                {gameStars < 1 && (
                    <div className={styles.hint}>{t('common.multiplayer.feedbackForm.minStars')}</div>
                )}
                {error && (
                    <div className={styles.error}>{t('common.multiplayer.feedbackForm.error')}</div>
                )}
                <button type="button" className={styles.skipButton} onClick={handleSkip} disabled={sending}>
                    {t('common.multiplayer.feedbackForm.skip')}
                </button>
            </div>
        </div>
    );
}
