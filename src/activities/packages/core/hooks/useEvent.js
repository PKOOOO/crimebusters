import { useEffect, useRef } from 'react';
import { useWebSocket } from './useWebSocket';

// Mantenemos el handler en una ref para que la suscripción NO se recree cuando
// el caller pase un handler inline (sin useCallback). Si re-suscribiéramos en
// cada render se podrían perder eventos justo en el hueco entre el unsubscribe
// y el subscribe siguiente, además de generar churn innecesario de listeners.
export function useEvent(action, handler) {
    const { subscribe } = useWebSocket();
    const handlerRef = useRef(handler);

    useEffect(() => {
        handlerRef.current = handler;
    }, [handler]);

    useEffect(() => {
        return subscribe(action, (message) => handlerRef.current?.(message));
    }, [subscribe, action]);
}
