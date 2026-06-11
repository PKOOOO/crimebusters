import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useMultiplayer, useTranslate } from '@educaplay/core/hooks';
import { Banner } from '../Banner';

const MESSAGES_PER_RESULT = 3;

// Banner que aparece al cerrarse la pregunta con un mensaje aleatorio de
// ánimo (acierto) o consuelo (fallo). Se elige una vez por respuesta y se
// mantiene estable mientras dura el modal de puntos
export function AnswerResultBanner() {
    const t = useTranslate();
    const { isPlayer } = useMultiplayer();
    const questionPhase = useSelector(state => state.multiplayer.question?.phase ?? null);
    const questionIndex = useSelector(state => state.multiplayer.question?.index ?? null);
    const isAnimating = useSelector(state => state.game.isAnimating);

    const answerResult = useSelector(state => {
        if (questionIndex == null) return null;
        return state.game.questions[questionIndex]?.answerResult ?? null;
    });

    const message = useMemo(() => {
        if (!answerResult) return '';
        const prefix = answerResult.isCorrect ? 'correct' : 'incorrect';
        const index = Math.floor(Math.random() * MESSAGES_PER_RESULT) + 1;
        return t(`common.multiplayer.answer.messages.${prefix}${index}`);
    }, [answerResult, t]);

    const visible = isPlayer
        && questionPhase === 'closed'
        && answerResult != null
        && !isAnimating;

    return (
        <Banner visible={visible} enterDelay={1.2}>
            {message}
        </Banner>
    );
}
