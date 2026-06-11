import { useState, useEffect } from 'react';

// Devuelve los segundos restantes hasta endsAt (timestamp absoluto del servidor en segundos)
// Retorna null si no hay deadline activo. 0 cuando ya ha expirado.
// Llama a onExpire una sola vez en el momento exacto del vencimiento.
export function useServerCountdown(endsAt, onExpire) {
    const [secondsLeft, setSecondsLeft] = useState(() => computeSecondsLeft(endsAt));

    useEffect(() => {
        if (endsAt == null) {
            setSecondsLeft(null);
            return;
        }

        let expired = false;
        const tick = () => {
            const remaining = computeSecondsLeft(endsAt);
            setSecondsLeft(remaining);
            if (remaining === 0 && !expired) {
                expired = true;
                if (typeof onExpire === 'function') {
                    onExpire();
                }
            }
        };

        tick();
        const intervalId = setInterval(tick, 250);
        return () => clearInterval(intervalId);
    }, [endsAt, onExpire]);

    return secondsLeft;
}

function computeSecondsLeft(endsAt) {
    if (endsAt == null) return null;
    const remainingMs = endsAt * 1000 - Date.now();
    if (remainingMs <= 0) return 0;
    return Math.ceil(remainingMs / 1000);
}
