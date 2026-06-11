import { useState, useCallback, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { pauseGame, resumeGame } from '@educaplay/store/slices/gameSlice';
import { useGameSounds } from '@educaplay/core/hooks';
import { NAME_SOUND_INTRO } from '@educaplay/core';
import { useEvent } from '../../hooks/useEvent';
import { CountdownLoading } from '../CountdownLoading';
import styles from './QuestionCountdown.module.scss';

const COUNTDOWN_SECONDS = 5;

const PHASES = {
    WAITING: 'waiting',
    COUNTING: 'counting',
    PLAYING: 'playing',
};

export function QuestionCountdown() {
    // Si tras un F5 ya hay una pregunta abierta o cerrada en el backend,
    // arrancamos directamente en PLAYING en vez de quedarnos esperando un
    // questionStart que nunca va a llegar (ya se emitió antes de recargar).
    // En 'closed' el PlayerPointsModal se encarga de mostrar el resultado,
    // así que tampoco tiene sentido enseñar "Esperando al profesor...".
    const initialPhase = useSelector(state => {
        const q = state.multiplayer.question;
        const hasQuestion = q && q.index != null && (q.phase === 'answering' || q.phase === 'closed');
        return hasQuestion ? PHASES.PLAYING : PHASES.WAITING;
    });
    const alreadyAnswered = useSelector(state => state.multiplayer.question?.alreadyAnswered ?? false);
    const [phase, setPhase] = useState(initialPhase);
    const [countingKey, setCountingKey] = useState(0);
    const gameSounds = useGameSounds();
    const dispatch = useDispatch();

    const handleQuestionStart = useCallback(() => {
        setCountingKey(prev => prev + 1);
        setPhase(PHASES.COUNTING);
    }, []);

    const handleCountdownEnd = useCallback(() => {
        setPhase(PHASES.PLAYING);
        gameSounds.play(NAME_SOUND_INTRO);
    }, [gameSounds]);

    useEvent('questionStart', handleQuestionStart);

    // Mientras el overlay está visible (equivalente al questionScreen del host)
    // pausamos el juego para que el jugador no pueda contestar ni con clic ni
    // con teclado antes de que termine la cuenta atrás.
    // Tras un F5 sobre una pregunta que el jugador ya había contestado, el
    // overlay arranca directamente en PLAYING (no hay cuenta atrás que mostrar),
    // pero NO debemos reanudar: el servidor sólo cuenta la primera respuesta y
    // useMultiplayerSync ya ha pausado el juego para evitar que el jugador
    // vuelva a seleccionar un nenúfar. Si despachásemos resumeGame aquí
    // pisaríamos esa pausa por orden de effects (sibling posterior gana).
    useEffect(() => {
        if (phase === PHASES.PLAYING && !alreadyAnswered) {
            dispatch(resumeGame());
        } else {
            dispatch(pauseGame());
        }
    }, [phase, alreadyAnswered, dispatch]);

    if (phase === PHASES.PLAYING) return null;

    return (
        <div className={styles.overlay}>
            <div className={styles.content}>
                {phase === PHASES.WAITING && (
                    <span className={styles.waitingText}>Esperando al profesor...</span>
                )}
                {phase === PHASES.COUNTING && (
                    <CountdownLoading
                        key={countingKey}
                        initialCount={COUNTDOWN_SECONDS}
                        onCountdownEnd={handleCountdownEnd}
                    />
                )}
            </div>
        </div>
    );
}
