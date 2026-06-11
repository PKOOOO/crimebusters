import { motion } from "framer-motion";
import styles from "./RankingModal.module.scss";
import { Cup } from "@educaplay/core/Icons/Cup";
import { PointsIcon } from "../HostViewScore/Podium/icons/PointsIcon";
import { TrophyGoldColored } from "@educaplay/core/Icons/TrophyGoldColored";
import { TrophySilverColored } from "@educaplay/core/Icons/TrophySilverColored";
import { TrophyBronzeColored } from "@educaplay/core/Icons/TrophyBronzeColored";
import { ArrowUp } from "@educaplay/core/Icons/ArrowUp";
import { ArrowDown } from "@educaplay/core/Icons/ArrowDown";
import { Exit } from "@educaplay/core/Icons/Exit";
import { getInitials, getAvatarColor, resolveAvatarSrc } from "@educaplay/core/utils";
import { useTranslate } from "@educaplay/core/hooks";
import Dropdown from "@educaplay/core/components/AudioComponentControl/Dropdown";
import DropdownToggle from "@educaplay/core/components/AudioComponentControl/Dropdown/DropdownToggle";
import DropdownItem from "@educaplay/core/components/AudioComponentControl/Dropdown/DropdownItem";

const MEDAL_ICONS = {
    1: TrophyGoldColored,
    2: TrophySilverColored,
    3: TrophyBronzeColored,
};

const POSITION_CLASS = {
    1: "positionGold",
    2: "positionSilver",
    3: "positionBronze",
};

// El modal entra desde abajo y sale hacia abajo; el overlay solo hace fade.
// Mismo timing que AnswerStatsModal para que el intercambio quede simétrico
// (400 ms exit del modal anterior + 400 ms entrada del de ranking)
const MODAL_TRANSITION = { duration: 0.4, ease: "easeOut" };

// El indicador de cambio de posición aparece tras el modal con un pequeño
// rebote para reforzar la sensación de "salto" en el ranking. Lo retrasamos
// para que se vea después de que el modal esté ya colocado
const DELTA_TRANSITION = {
    type: "spring",
    stiffness: 380,
    damping: 18,
    delay: 0.5,
};

export function RankingModal({ ranking, onKick }) {
    const t = useTranslate();
    return (
        <motion.div
            className={styles.overlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={MODAL_TRANSITION}
        >
            <motion.div
                className={styles.modal}
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={MODAL_TRANSITION}
            >
                <div className={styles.header}>
                    <Cup className={styles.trophyIcon} />
                    <h3 className={styles.title}>{t('common.multiplayer.ranking.title')}</h3>
                </div>

                <div className={styles.wrapperList}>
                    <div className={styles.list}>
                        {ranking.map((player) => {
                            const avatarSrc = resolveAvatarSrc(player.avatar, player.photo);
                            const MedalIcon = MEDAL_ICONS[player.position];
                            const positionModifier = POSITION_CLASS[player.position];
                            const positionClassName = positionModifier
                                ? `${styles.position} ${styles[positionModifier]}`
                                : styles.position;
                            const delta = player.positionDelta ?? 0;
                            // Solo mostramos la pastilla cuando hay cambio real
                            // de posición: subida (verde) o bajada (amarillo).
                            // Si el jugador mantiene la posición o es la
                            // primera ronda (positionDelta === null), no
                            // pintamos nada
                            const showDelta = player.positionDelta != null && delta !== 0;
                            const deltaModifier = delta > 0 ? styles.deltaUp : styles.deltaDown;
                            const deltaClassName = `${styles.delta} ${deltaModifier}`;
                            return (
                            <div key={player.playerId} className={styles.row}>
                                <div className={positionClassName}>{player.position}</div>

                                <div className={styles.avatarWrapper}>
                                    {avatarSrc ? (
                                        <img src={avatarSrc} alt="" className={styles.avatar} />
                                    ) : (
                                        <div
                                            className={styles.avatarPlaceholder}
                                            style={{ backgroundColor: getAvatarColor(player.nickname) }}
                                        >
                                            {getInitials(player.nickname)}
                                        </div>
                                    )}
                                    <span className={styles.onlineDot} />
                                </div>

                                <div className={styles.nicknameArea}>
                                    <span className={styles.nickname}>{player.nickname}</span>
                                    {MedalIcon && <MedalIcon className={styles.medalIcon} />}
                                </div>

                                {showDelta && (
                                    <motion.div
                                        className={deltaClassName}
                                        initial={{ opacity: 0, y: delta > 0 ? 8 : -8, scale: 0.6 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        transition={DELTA_TRANSITION}
                                    >
                                        {delta > 0 ? <ArrowUp className={styles.deltaIcon} /> : <ArrowDown className={styles.deltaIcon} />}
                                        <span className={styles.deltaValue}>{Math.abs(delta)}</span>
                                    </motion.div>
                                )}

                                <div className={styles.pointsArea}>
                                    <div className={styles.pointsBlock}>
                                        <span className={styles.pointsLabel}>{t('common.multiplayer.ranking.arcadePoints')}</span>
                                        <div className={styles.pointsPill}>
                                            <PointsIcon className={styles.pointsIcon} />
                                            <span className={styles.pointsValue}>{(player.arcadePoints ?? player.points ?? 0).toFixed(0)}</span>
                                        </div>
                                    </div>
                                    <div className={styles.pointsBlock}>
                                        <span className={styles.pointsLabel}>{t('common.multiplayer.ranking.realPoints')}</span>
                                        <span className={styles.fractionValue}>
                                            <span className={styles.percentSymbol}>%</span>
                                            {(player.playedCount ?? 0) > 0 ? Math.round(((player.correctCount ?? 0) / player.playedCount) * 100) : 0}
                                        </span>
                                    </div>
                                </div>

                                {onKick && (
                                    <Dropdown
                                        matchToggleWidth={false}
                                        toggle={
                                            <DropdownToggle
                                                className={styles.optionsToggle}
                                                aria-label={t('common.multiplayer.ranking.optionsAria')}
                                            >
                                                <span className={styles.optionsDot} aria-hidden="true" />
                                                <span className={styles.optionsDot} aria-hidden="true" />
                                                <span className={styles.optionsDot} aria-hidden="true" />
                                            </DropdownToggle>
                                        }
                                    >
                                        <DropdownItem
                                            className={styles.kickItem}
                                            onClick={() => onKick(player.playerId)}
                                        >
                                            <Exit className={styles.kickItemIcon} />
                                            {t('common.multiplayer.kick.playerTitle')}
                                        </DropdownItem>
                                    </Dropdown>
                                )}
                            </div>
                            );
                        })}
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}
