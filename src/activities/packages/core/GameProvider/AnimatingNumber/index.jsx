import { useCallback, useEffect, useRef } from "react";
import { useMotionValue, useSpring } from "framer-motion";
import PropTypes from 'prop-types'
import { NAME_SOUND_POINTS_COUNT, useGameSounds } from "@educaplay/core";

export function AnimatingNumber({ value, decimals = 3, className, delay=0, slow=false, onAnimationComplete }) {
    const nodeRef = useRef();
    const soundSourceRef = useRef(null);
    const gameSound = useGameSounds();
    const motionValue = useMotionValue(0);
    // slow=true alarga el conteo ~1/3 (stiffness 220 → 124, mismas damping y mass)
    const springValue = useSpring(motionValue, {
        damping: 40,
        stiffness: slow ? 124 : 220,
        mass: 0.5,
    });

    // Guardamos onAnimationComplete en un ref para que el useEffect que escucha
    // el spring NO se re-suscriba en cada render del padre. Si lo metiéramos en
    // las deps, una arrow nueva del padre dispararía cleanup → springValue.stop()
    // a mitad del conteo, dejando el muelle parado y sin llamar al callback
    const onAnimationCompleteRef = useRef(onAnimationComplete);
    onAnimationCompleteRef.current = onAnimationComplete;

    const format = useCallback((n) => n.toFixed(decimals), [decimals]);

    const stopCountSound = useCallback(() => {
        if (soundSourceRef.current) {
            try { soundSourceRef.current.stop(); } catch (e) { /* ya detenido */ }
            soundSourceRef.current = null;
        }
    }, []);

    useEffect(() => {
        const initialPoints = 0;
        nodeRef.current.textContent = format(initialPoints);
        const timeOut = setTimeout(() => {
            if(value > 0) soundSourceRef.current = gameSound.play(NAME_SOUND_POINTS_COUNT);
            motionValue.set(value);
        }, delay);

        return ()=>{
            clearTimeout(timeOut);
            stopCountSound();
        }

    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value, motionValue, decimals, delay]);

    useEffect(() => {
        const node = nodeRef.current;
        let completed = false;
        // Epsilon relativo al valor objetivo para detectar asentamiento del spring
        const epsilon = Math.max(0.5, Math.abs(value) * 0.001);

        // Si el valor objetivo es 0, el spring no se mueve y no emite "change".
        // Disparar inmediatamente el callback en ese caso
        if (value === 0) {
            completed = true;
            if (onAnimationCompleteRef.current) onAnimationCompleteRef.current();
        }

        const unsubscribeChange = springValue.on("change", (latest) => {
            node.textContent = format(latest);
            if (!completed && Math.abs(latest - value) <= epsilon) {
                completed = true;
                stopCountSound();
                if (onAnimationCompleteRef.current) onAnimationCompleteRef.current();
            }
        });

        return () => {
            unsubscribeChange();
            springValue.stop();
        };
    }, [springValue, value, format, stopCountSound]);

    return <span className={className} ref={nodeRef} />;
}

AnimatingNumber.propTypes = {
    value: PropTypes.number,
    decimals: PropTypes.number,
    className: PropTypes.string,
    delay: PropTypes.number,
    slow: PropTypes.bool,
    onAnimationComplete: PropTypes.func
}