import { useCallback, useRef, useState } from "react";
import { useAnimate } from "framer-motion";

export function usePodiumTimeline(playerCount, onPositionRevealedRef, onAnimationCompleteRef, skipIntro = false) {
    const [scope, animate] = useAnimate();
    const [revealedPlayers, setRevealedPlayers] = useState(() => {
        // Si entramos con la animación ya completada (F5 del host tras
        // desvelar el podio), pintamos directamente todas las posiciones
        if (!skipIntro) return new Set();
        const positions = [];
        if (playerCount >= 3) positions.push(3);
        if (playerCount >= 2) positions.push(2);
        positions.push(1);
        return new Set(positions);
    });
    const [announcingWinner, setAnnouncingWinner] = useState(skipIntro);
    const countWaitersRef = useRef({});

    const makeCountWaiter = (n) => {
        let resolver;
        const promise = new Promise((resolve) => {
            resolver = resolve;
        });
        countWaitersRef.current[n] = { promise, resolve: resolver };
    };

    const onCountComplete = useCallback((position) => {
        const waiter = countWaitersRef.current[position];
        if (waiter) waiter.resolve();
    }, []);

    const play = useCallback(async () => {
        const sleep = (s) => new Promise((r) => setTimeout(r, s * 1000));

        // Preparar waiters para las posiciones que existen
        const positions = [];
        if (playerCount >= 3) positions.push(3);
        if (playerCount >= 2) positions.push(2);
        positions.push(1);

        for (const n of positions) {
            makeCountWaiter(n);
        }

        const sel = (name) => `[data-animate="${name}"]`;

        // Si el host hace F5 con el podio ya revelado, pintamos el estado
        // final sin reproducir la animación de entrada. revealedPlayers ya
        // viene completo desde el useState inicial; aquí solo aseguramos las
        // animaciones a su valor final y notificamos onAnimationComplete
        if (skipIntro) {
            animate(sel("logo"), { opacity: 1, y: 0 }, { duration: 0 });
            animate(sel("title"), { opacity: 1, y: 0 }, { duration: 0 });
            animate(sel("light"), { opacity: 0 }, { duration: 0 });
            for (const n of positions) {
                animate(sel(`player-${n}`), { opacity: 1 }, { duration: 0 });
                animate(sel(`platform-${n}`), { opacity: 1, scaleY: 1 }, { duration: 0 });
                animate(sel(`rank-${n}`), { opacity: 1, scale: 1 }, { duration: 0 });
                animate(sel(`avatar-${n}`), { opacity: 1, y: 0 }, { duration: 0 });
                animate(sel(`name-${n}`), { opacity: 1, y: 0 }, { duration: 0 });
                animate(sel(`score-${n}`), { opacity: 1, y: 0 }, { duration: 0 });
            }
            animate(sel("laurel"), { opacity: 1, scale: 1 }, { duration: 0 });
            if (onAnimationCompleteRef?.current) {
                onAnimationCompleteRef.current();
            }
            return;
        }

        // Calcular posición X de la luz para cada jugador
        const podiumEl = scope.current?.querySelector(`[data-animate="player-1"]`)?.parentElement;
        let lightX = {};
        if (podiumEl) {
            const podiumRect = podiumEl.getBoundingClientRect();
            const podiumCenter = podiumRect.left + podiumRect.width / 2;
            for (const n of positions) {
                const playerEl = podiumEl.querySelector(`[data-animate="player-${n}"]`);
                if (playerEl) {
                    const playerRect = playerEl.getBoundingClientRect();
                    const playerCenter = playerRect.left + playerRect.width / 2;
                    lightX[n] = playerCenter - podiumCenter;
                }
            }
        }

        // La luz empieza posicionada en el primer jugador que se revelará
        const firstPosition = positions[0];
        const startLightX = lightX[firstPosition] ?? 0;

        // Estado inicial: todo oculto
        animate(sel("logo"), { opacity: 0, y: -220 }, { duration: 0 });
        animate(sel("title"), { opacity: 0, y: -220 }, { duration: 0 });
        animate(sel("light"), { opacity: 0, y: -220, x: startLightX }, { duration: 0 });

        for (const n of positions) {
            animate(sel(`player-${n}`), { opacity: 0 }, { duration: 0 });
            animate(sel(`platform-${n}`), { opacity: 0, scaleY: 0 }, { duration: 0 });
            animate(sel(`rank-${n}`), { opacity: 0, scale: 0 }, { duration: 0 });
            animate(sel(`avatar-${n}`), { opacity: 0, y: 60 }, { duration: 0 });
            animate(sel(`name-${n}`), { opacity: 0, y: 60 }, { duration: 0 });
            animate(sel(`score-${n}`), { opacity: 0, y: 60 }, { duration: 0 });
        }
        animate(sel("laurel"), { opacity: 0, scale: 0 }, { duration: 0 });

        // Esperar un frame para que los estados iniciales se apliquen
        await new Promise((r) => requestAnimationFrame(r));

        // Logo desde arriba
        await animate(sel("logo"), { y: 0, opacity: 1 }, { duration: 0.5, ease: "easeOut" });

        // Título desde arriba
        await animate(sel("title"), { y: 0, opacity: 1 }, { duration: 0.45, ease: "easeOut" });

        // Luz baja desde arriba
        await animate(sel("light"), { y: 0, opacity: 0.4 }, { duration: 0.7, ease: "easeOut" });

        // Revelar jugadores en orden: 3ro, 2do, 1ro (solo los que existan)
        const revealOrder = positions;
        const opacitySteps = { 3: 0.4, 2: 0.6, 1: 0.8 };

        for (let i = 0; i < revealOrder.length; i++) {
            const pos = revealOrder[i];
            const isWinner = pos === 1;

            // Mover la luz al jugador actual (excepto el primero, ya está ahí)
            if (i > 0) {
                await sleep(0.25);
                await animate(sel("light"), { x: lightX[pos] ?? 0, opacity: opacitySteps[pos] ?? 0.6 }, { duration: 0.7, ease: "easeInOut" });
            }

            if (isWinner) {
                setAnnouncingWinner(true);
            }

            // Duración mínima del reveal para los puestos 2 y 3 (3.5 s). Se arranca
            // en paralelo y se espera al final del slot, garantizando el tiempo
            // total aunque el conteo del spring termine antes
            const minSlotPromise = isWinner ? null : sleep(2.7);

            // Mostrar la columna del jugador antes de animar sus hijos (await para evitar race
            // con re-renders de React cuando solo hay un jugador)
            await animate(sel(`player-${pos}`), { opacity: 1 }, { duration: 0 });

            // Plataforma escala desde abajo
            await animate(sel(`platform-${pos}`), { opacity: 1, scaleY: 1 }, { duration: isWinner ? 0.7 : 0.55, ease: [0.34, 1.56, 0.64, 1] });
            animate(sel(`rank-${pos}`), { opacity: 1, scale: 1 }, { duration: 0.4, ease: [0.34, 1.56, 0.64, 1] });

            // Avatar, nombre, puntaje
            await animate(sel(`avatar-${pos}`), { y: 0, opacity: 1 }, { duration: isWinner ? 0.45 : 0.4, ease: "easeOut" });
            animate(sel(`name-${pos}`), { y: 0, opacity: 1 }, { duration: 0.35, delay: 0.1, ease: "easeOut" });
            await animate(sel(`score-${pos}`), { y: 0, opacity: 1 }, { duration: 0.35, delay: 0.2, ease: "easeOut" });

            // Laurel solo para el ganador
            if (isWinner) {
                await animate(sel("laurel"), { opacity: 1, scale: [0, 1.1, 1] }, { duration: 0.5, ease: "easeOut" });
            }

            setRevealedPlayers((prev) => new Set([...prev, pos]));

            // Notificar al host que esta posición ha sido revelada
            if (onPositionRevealedRef?.current) {
                onPositionRevealedRef.current(pos);
            }

            // Esperar a que termine el conteo de puntos
            await countWaitersRef.current[pos].promise;

            // Asegurar la duración mínima del slot para los puestos 2 y 3
            if (minSlotPromise) await minSlotPromise;
        }

        // Pequeña pausa para que el ganador respire antes de revelar el aside
        await sleep(1.5);

        // Notificar que la animación del podio (hasta el ganador) ha terminado.
        // La barra lateral se revelará en paralelo al fundido de la luz.
        if (onAnimationCompleteRef?.current) {
            onAnimationCompleteRef.current();
        }

        // La luz se funde a 0
        await animate(sel("light"), { opacity: 0 }, { duration: 1.0, ease: "easeInOut" });
    }, [animate, scope, playerCount, onPositionRevealedRef, onAnimationCompleteRef, skipIntro]);

    return { scope, play, revealedPlayers, announcingWinner, onCountComplete };
}
