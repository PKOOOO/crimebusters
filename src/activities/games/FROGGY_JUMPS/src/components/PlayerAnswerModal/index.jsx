import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { useMultiplayer, useTranslate } from '@educaplay/core/hooks';
import { AudioComponent } from '@educaplay/core/components';
import { Question } from '@educaplay/core/Icons/Question';
import styles from './PlayerAnswerModal.module.scss';

// Devuelve la familia multimedia de un answer ('image', 'audio', 'video' o null)
function getMediaKind(answer) {
    if (!answer?.source || !answer?.type) return null;
    const type = String(answer.type);
    if (type === 'image' || type.startsWith('image/')) return 'image';
    if (type === 'audio' || type.startsWith('audio/')) return 'audio';
    if (type === 'video' || type.startsWith('video/')) return 'video';
    return null;
}

// Muestra al jugador la respuesta que ha elegido mientras espera a que el host
// cierre la pregunta. La rana no salta al pulsar para no delatar al resto si
// es correcta o incorrecta; este modal le confirma su elección
export default function PlayerAnswerModal() {
    const { isPlayer } = useMultiplayer();
    const t = useTranslate();
    const questionIndex = useSelector(state => state.multiplayer.question?.index ?? null);
    const questionPhase = useSelector(state => state.multiplayer.question?.phase ?? null);

    const selectedAnswer = useSelector(state => {
        if (questionIndex == null) return null;
        const question = state.game.questions[questionIndex];
        const answerPayload = question?.answer;
        if (!answerPayload || typeof answerPayload !== 'object') return null;
        const answerIndex = answerPayload.answer;
        if (typeof answerIndex !== 'number') return null;
        return question.answers?.[answerIndex] ?? null;
    });

    const visible = isPlayer
        && questionPhase === 'answering'
        && selectedAnswer != null;

    const mediaKind = getMediaKind(selectedAnswer);
    const hasText = selectedAnswer?.answer && String(selectedAnswer.answer).trim().length > 0;

    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    className={styles.overlay}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    <motion.div
                        className={styles.modal}
                        initial={{ y: '100%', opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: '100%', opacity: 0 }}
                        transition={{ duration: 0.35, ease: 'easeOut' }}
                    >
                        {(hasText || mediaKind) && (
                            <div className={styles.textBlock}>
                                <div className={styles.label}>
                                    <span className={styles.labelIcon}>
                                        <Question size={32} />
                                    </span>
                                    <span className={styles.labelTxt}>{t('common.multiplayer.answer.youAnswered')}</span>
                                </div>
                                <div className={styles.text}>
                                    {mediaKind === 'image' && (
                                        <img
                                            className={styles.image}
                                            src={selectedAnswer.source}
                                            alt={selectedAnswer.answer ?? ''}
                                        />
                                    )}
                                    {mediaKind === 'audio' && (
                                        <AudioComponent
                                            className={styles.audio}
                                            source={selectedAnswer.source}
                                            big
                                        />
                                    )}
                                    {mediaKind === 'video' && (
                                        <video
                                            className={styles.video}
                                            src={selectedAnswer.source}
                                            controls
                                            playsInline
                                        />
                                    )}
                                    {hasText && selectedAnswer.answer}
                                </div>
                            </div>
                        )}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
