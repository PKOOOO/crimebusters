import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import clsx from "clsx";
import { Switch } from "../../Switch";
import { getMatchFeedback } from "@educaplay/core/services/multiplayer";
import { useTranslate } from "@educaplay/core/hooks";
import { matchFeedbackAggregatesUpdated } from "@educaplay/store/slices/multiplayerSlice";
import { FeedbackUp } from "../../../Icons/FeedbackUp";
import { FeedbackDown } from "../../../Icons/FeedbackDown";
import { ScorePanelHeader } from "../ScorePanelHeader";
import styles from "./FeedbackPanel.module.scss";

function Star({ fillPercent }) {
    return (
        <div className={styles.starWrapper}>
            <svg viewBox="0 12.705 512 486.59" className={styles.starEmpty}>
                <polygon points="256.814,12.705 317.205,198.566 512.631,198.566 354.529,313.435 414.918,499.295 256.814,384.427 98.713,499.295 159.102,313.435 1,198.566 196.426,198.566" />
            </svg>
            <div className={styles.starFillClip} style={{ width: `${fillPercent}%` }}>
                <svg viewBox="0 12.705 512 486.59" className={styles.starFilled}>
                    <polygon points="256.814,12.705 317.205,198.566 512.631,198.566 354.529,313.435 414.918,499.295 256.814,384.427 98.713,499.295 159.102,313.435 1,198.566 196.426,198.566" />
                </svg>
            </div>
        </div>
    );
}

function StarsAverage({ avg }) {
    return (
        <div className={styles.starRow}>
            {[1, 2, 3, 4, 5].map(n => {
                const fill = Math.max(0, Math.min(1, avg - (n - 1))) * 100;
                return <Star key={n} fillPercent={fill} />;
            })}
        </div>
    );
}

function ThumbsAverage({ up, down }) {
    const total = up + down;
    const upPct = total > 0 ? Math.round((up / total) * 100) : 0;
    const downPct = total > 0 ? 100 - upPct : 0;

    return (
        <div className={styles.thumbsBars}>
            <div className={styles.thumbsBarRow}>
                <div className={styles.thumbsBarIcon}>
                    <FeedbackUp color="#67A516" className={styles.thumbBarSvg} />
                </div>
                <div className={styles.thumbsBarTrack}>
                    <div className={clsx(styles.thumbsBarFill, styles.thumbsBarFillUp)} style={{ width: `${upPct}%` }} />
                </div>
                <div className={styles.thumbsBarPercent}>{upPct}%</div>
            </div>
            <div className={styles.thumbsBarRow}>
                <div className={styles.thumbsBarIcon}>
                    <FeedbackDown color="#67A516" className={styles.thumbBarSvg} />
                </div>
                <div className={styles.thumbsBarTrack}>
                    <div className={clsx(styles.thumbsBarFill, styles.thumbsBarFillDown)} style={{ width: `${downPct}%` }} />
                </div>
                <div className={styles.thumbsBarPercent}>{downPct}%</div>
            </div>
        </div>
    );
}

export function FeedbackPanel({ title, backgroundImage }) {
    const t = useTranslate();
    const dispatch = useDispatch();
    const aggregates = useSelector(state => state.multiplayer.feedback.aggregates);
    const containerStyle = backgroundImage
        ? { backgroundImage: `url(${backgroundImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }
        : undefined;
    // Solo contamos jugadores conectados: si alguien se desconectó al acabar,
    // no bloquearía el "Todos han valorado". Si el campo 'connected' no viene
    // en el player (datos legacy), lo consideramos conectado por defecto
    const totalPlayers = useSelector(state =>
        state.multiplayer.players.filter(p => p.connected !== false).length
    );
    const [showResults, setShowResults] = useState(false);

    // Si entramos sin agregados (p. ej. F5 del host), pedimos una snapshot inicial.
    // El evento matchFeedbackUpdated mantiene el estado fresco después
    useEffect(() => {
        if (aggregates !== null) return;
        getMatchFeedback()
            .then(data => {
                if (data) dispatch(matchFeedbackAggregatesUpdated(data));
            })
            .catch(() => {});
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const count = aggregates?.count ?? 0;
    // Clamp visual: si alguien votó y luego se desconectó, count puede superar
    // a totalPlayers (actualmente conectados). Nunca mostramos "7/5"
    const displayCount = Math.min(count, totalPlayers);
    const allVoted = totalPlayers > 0 && count >= totalPlayers;

    const starsAvg = aggregates?.starsAvg ?? 0;
    const learning = aggregates?.learning ?? { up: 0, down: 0 };
    const recommend = aggregates?.recommend ?? { up: 0, down: 0 };

    return (
        <div className={styles.container} style={containerStyle}>
            <ScorePanelHeader title={title} subtitle={t('common.multiplayer.feedback.title')} SubtitleIcon={FeedbackUp} />

            <div className={styles.content}>
                <div className={styles.status}>
                    {allVoted
                        ? t('common.multiplayer.feedback.allVoted')
                        : t('common.multiplayer.feedback.voting', { count: displayCount, total: totalPlayers })}
                </div>

                {showResults && (
                    <div className={styles.results}>
                        <div className={styles.resultBlock}>
                            <div className={styles.resultTitle}>{t('common.multiplayer.feedback.gameRating')}</div>
                            <StarsAverage avg={starsAvg} />
                            <div className={styles.resultMeta}>{t('common.multiplayer.feedback.average', { avg: starsAvg.toFixed(1) })}</div>
                        </div>

                        <div className={styles.resultBlock}>
                            <div className={styles.resultTitle}>{t('common.multiplayer.feedback.learning')}</div>
                            <ThumbsAverage up={learning.up} down={learning.down} />
                        </div>

                        <div className={styles.resultBlock}>
                            <div className={styles.resultTitle}>{t('common.multiplayer.feedback.recommend')}</div>
                            <ThumbsAverage up={recommend.up} down={recommend.down} />
                        </div>
                    </div>
                )}

                <div className={styles.toggleRow}>
                    <span className={styles.toggleLabel}>{t('common.multiplayer.feedback.showOnScreen')}</span>
                    <Switch actived={showResults} onChange={() => setShowResults(v => !v)} />
                </div>
            </div>
        </div>
    );
}
