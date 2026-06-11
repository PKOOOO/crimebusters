import { useSelector } from 'react-redux';
import { useMultiplayer, useTranslate } from '@educaplay/core/hooks';
import { Banner } from '../Banner';

// Banner que aparece en la vista del jugador entre que envía su respuesta y
// el host cierra la pregunta. Usado por juegos que ocultan la elección al
// responder (p. ej. FROGGY_JUMPS) para que se entienda que la espera es
// porque faltan otros jugadores
export function WaitingForOthersBanner() {
    const t = useTranslate();
    const { isPlayer } = useMultiplayer();
    const questionIndex = useSelector(state => state.multiplayer.question?.index ?? null);
    const questionPhase = useSelector(state => state.multiplayer.question?.phase ?? null);
    const playerAnswer = useSelector(state => {
        if (questionIndex == null) return null;
        return state.game.questions[questionIndex]?.answer ?? null;
    });

    const visible = isPlayer
        && questionPhase === 'answering'
        && playerAnswer != null;

    return (
        <Banner visible={visible} enterDelay={1.2}>
            {t('common.multiplayer.answer.waitingForOthers')}
        </Banner>
    );
}
