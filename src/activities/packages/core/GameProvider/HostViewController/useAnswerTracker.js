import { useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useEvent } from '../../hooks/useEvent';

export function useAnswerTracker() {
    // Valor inicial desde el store para rehidratar tras F5 del host (el evento
    // playerAnswered no se reenvía al reconectar; la snapshot del REST sí)
    const hydratedCount = useSelector(state => state.multiplayer.question?.answeredCount ?? 0);
    const [answeredCount, setAnsweredCount] = useState(hydratedCount);

    const handlePlayerAnswered = useCallback((message) => {
        setAnsweredCount(message.answerCount ?? 0);
    }, []);

    useEvent('playerAnswered', handlePlayerAnswered);

    const reset = useCallback(() => {
        setAnsweredCount(0);
    }, []);

    return { answeredCount, reset };
}
