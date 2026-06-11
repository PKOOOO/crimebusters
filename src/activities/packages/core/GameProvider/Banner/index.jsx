import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './Banner.module.scss';

// Banner genérico tipo "píldora" anclado bajo el header. Aparece centrado
// horizontalmente con animación de entrada/salida desde arriba. Pensado para
// avisos breves no bloqueantes (espera entre jugadores, estados de pregunta,
// etc.). Aceptamos className para variantes visuales puntuales.
export function Banner({ visible, children, className, enterDelay = 0 }) {
    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    className={clsx(styles.banner, className)}
                    initial={{ y: -20, opacity: 0 }}
                    animate={{
                        y: 0,
                        opacity: 1,
                        transition: { duration: 0.25, ease: 'easeOut', delay: enterDelay },
                    }}
                    exit={{
                        y: -20,
                        opacity: 0,
                        transition: { duration: 0.25, ease: 'easeOut' },
                    }}
                >
                    {children}
                </motion.div>
            )}
        </AnimatePresence>
    );
}
