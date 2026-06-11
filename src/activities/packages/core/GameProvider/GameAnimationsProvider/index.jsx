import { useState } from "react";
import { GameAnimationsContext } from "./GameAnimationsContext";
import { motion, useAnimation } from "framer-motion";
import { AnimationHeart } from "@educaplay/core/Icons/AnimationHeart";
import { AnimationPoint  } from "@educaplay/core/Icons/AnimationPoint";
import classes from "./GameAnimationsProvider.module.scss";
import { NAME_ANIMATION_LIVES, NAME_ANIMATION_POINTS } from "../../utils";
import { easeOutExpo } from "../../utils/easing";

export function GameAnimationsProvider({ children }) {
    const heartAnimationControls = useAnimation();
    const pointAnimationControls = useAnimation();
    const [points, setPoints] = useState(0);

    const start = async (animationName, payload = {}) => {
        switch (animationName) {
            case NAME_ANIMATION_LIVES: {
                heartAnimationControls.start({
                    opacity: [0, 1, 1, 0],
                    y: ["80vh", "80vh", "9vh", "9vh"],
                    transition: {
                        duration: 3,
                        times: [0, 0, 0.4, 1]
                    }
                });
            }
            break;
            case NAME_ANIMATION_POINTS: {
                setPoints(payload.value ?? 0);
                pointAnimationControls.start({
                    opacity: [0, 1, 1, 0],
                    y: ["80vh", "80vh", "26vh", "22vh"],
                    transition: {
                        duration: 3.5,
                        times: [0, 0, 0.8, 1],
                        ease: easeOutExpo
                    }
                });
            }
            break;
            default: {
                throw new Error("Invalid animation name");
            }
        }
    }

    return (
        <GameAnimationsContext.Provider value={{ start }}>
            {children}

            <div className={classes.animationContainer}>
                <div className={classes.topCenter}>
                    <motion.div
                        initial={{ opacity: 0, y: "80vh" }}
                        animate={heartAnimationControls}
                        transition={{
                            duration: 2.5,
                            ease: "easeInOut",
                            times: [0, 0, 0.4, 1]
                        }}
                        >
                        <AnimationHeart className={classes.heart} />
                    </motion.div>
                </div>

                <div className={classes.topCenter}>
                    <motion.div
                        initial={{ opacity: 0, y: "80vh" }}
                        animate={pointAnimationControls}
                        transition={{
                            duration: 2.5,
                            ease: easeOutExpo,
                            times: [0, 0, 0.3, 1]
                        }}
                        >
                        <div className={classes.points}>
                            <AnimationPoint />
                            <span className={classes["points__text"]}> + {points.toFixed(3)} </span>
                        </div>
                    </motion.div>
                </div>
            </div>
        </GameAnimationsContext.Provider>
    )
}
