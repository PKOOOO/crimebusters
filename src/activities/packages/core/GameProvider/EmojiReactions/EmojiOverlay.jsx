import { motion, AnimatePresence } from 'framer-motion';
import { useEmojiOverlay } from './useEmojiOverlay';
import styles from './EmojiOverlay.module.scss';

// Curva del usuario:
// linear(0, 0.013 1%, 0.051 2.2%, 0.404 9.8%, 0.51 12.6%, 0.602 15.5%,
//        0.683 18.7%, 0.754 22.2%, 0.813 26%, 0.861 30.2%, 0.9 34.8%,
//        0.931 40%, 0.972 52.7%, 0.992 70.2%, 1)
// Aplicada a un desplazamiento total de -18vh hacia arriba.
const Y_TIMES = [0, 0.01, 0.022, 0.098, 0.126, 0.155, 0.187, 0.222, 0.26,
    0.302, 0.348, 0.4, 0.527, 0.702, 1];
const Y_KEYFRAMES = ['0vh', '-0.23vh', '-0.92vh', '-7.27vh', '-9.18vh', '-10.84vh',
    '-12.29vh', '-13.57vh', '-14.63vh', '-15.5vh', '-16.2vh', '-16.76vh',
    '-17.5vh', '-17.86vh', '-18vh'];

export function EmojiOverlay() {
    const emojis = useEmojiOverlay();

    if (emojis.length === 0) return null;

    return (
        <div className={styles.overlay}>
            <AnimatePresence>
                {emojis.map(({ id, Icon, origin }) => (
                    <motion.div
                        key={id}
                        className={styles.emoji}
                        style={{ left: origin.x, top: origin.y }}
                        initial={{ x: '-50%', y: '-50%', opacity: 0, scale: 0.3 }}
                        animate={{
                            x: '-50%',
                            y: Y_KEYFRAMES,
                            opacity: [0, 1, 1, 0],
                            scale: [0.3, 1.4, 1, 1],
                        }}
                        transition={{
                            duration: 2,
                            y: { duration: 2, times: Y_TIMES, ease: 'linear' },
                            scale: { duration: 2, times: [0, 0.12, 0.22, 1], ease: ['backOut', 'easeOut', 'linear'] },
                            opacity: { duration: 2, times: [0, 0.08, 0.82, 1], ease: 'easeInOut' },
                        }}
                    >
                        <Icon size={72} />
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}
