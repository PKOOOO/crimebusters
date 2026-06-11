import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useGameSounds, useMultiplayer, useTranslate } from '@educaplay/core/hooks';
import { NAME_SOUND_ACTIVE_BANK } from '@educaplay/core';
import { motion, AnimatePresence } from 'framer-motion';
import { AnswerCorrect } from '@educaplay/core/Icons/AnswerCorrect';
import { AnswerIncorrect } from '@educaplay/core/Icons/AnswerIncorrect';
import { Cup } from '@educaplay/core/Icons/Cup';
import { PointsIcon } from '../HostViewScore/Podium/icons/PointsIcon';
import styles from './PlayerPointsModal.module.scss';

export function PlayerPointsModal() {
    const { isPlayer } = useMultiplayer();
    const t = useTranslate();
    const gameSounds = useGameSounds();
    const questionPhase = useSelector(state => state.multiplayer.question?.phase ?? null);
    const questionIndex = useSelector(state => state.multiplayer.question?.index ?? null);
    // Esperamos a que termine cualquier animación del juego antes de mostrar
    // el resultado: en FROGGY_JUMPS la rana salta tras cerrarse la pregunta
    // y el modal no debe taparla
    const isAnimating = useSelector(state => state.game.isAnimating);

    const answerResult = useSelector(state => {
        if (questionIndex === null) return null;
        return state.game.questions[questionIndex]?.answerResult ?? null;
    });

    // Cuando el host entra en su modal de ranking entre preguntas el backend
    // difunde 'rankingShown'. A partir de ahí mostramos al jugador la posición
    // que ocupa en el ranking actual (lo recibimos vía 'rankingUpdated' tras
    // cerrarse la pregunta). El flag se resetea en cada nueva pregunta
    const rankingShown = useSelector(state => state.multiplayer.rankingShown);
    const ranking = useSelector(state => state.multiplayer.ranking);
    const playerId = useSelector(state => state.multiplayer.playerData?.id ?? null);
    const playerPosition = playerId == null
        ? null
        : (ranking.find(p => String(p.playerId) === String(playerId))?.position ?? null);

    const visible = isPlayer && questionPhase === 'closed' && answerResult !== null && !isAnimating;

    // Suena enunciado.mp3 al entrar y salir del modal para acompañar la
    // aparición/cierre del resultado en la pantalla del jugador
    const isFirstRender = useRef(true);
    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }
        gameSounds.play(NAME_SOUND_ACTIVE_BANK);
    }, [visible, gameSounds]);

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
                        className={`${styles.modal} ${answerResult.isCorrect ? styles.modalCorrect : styles.modalIncorrect}`}
                        initial={{ y: '100%', opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: '100%', opacity: 0 }}
                        transition={{ duration: 0.35, ease: 'easeOut' }}
                    >
                        <div className={styles.icon}>
                            {answerResult.isCorrect
                                ? <AnswerCorrect className={styles.iconSvg} />
                                : <AnswerIncorrect className={styles.iconSvg} />}
                        </div>

                        <div className={styles.label}>
                            {answerResult.isCorrect
                                ? t('common.multiplayer.answer.correct')
                                : t('common.multiplayer.answer.incorrect')}
                        </div>

                        <div className={styles.points}>
                            <PointsIcon className={styles.pointsIcon} />
                            <span className={styles.pointsValue}>{answerResult.points.toFixed(0)}</span>
                        </div>

                        <AnimatePresence>
                            {rankingShown && playerPosition !== null && (
                                <motion.div
                                    key="position"
                                    className={styles.position}
                                    initial={{ y: 20, opacity: 0, scale: 0.85 }}
                                    animate={{ y: 0, opacity: 1, scale: 1 }}
                                    exit={{ y: 20, opacity: 0, scale: 0.85 }}
                                    transition={{ duration: 0.4, ease: 'easeOut' }}
                                >
                                    <Cup className={styles.positionIcon} />
                                    <span className={styles.positionLabel}>
                                        {t('common.multiplayer.answer.position', { position: playerPosition })}
                                    </span>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
