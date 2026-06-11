import clsx from "clsx";
import { Restart } from "../../../Icons/Restart";
import { Cup } from "../../../Icons/Cup";
import { Report } from "../../../Icons/Report";
import { FeedbackUp } from "../../../Icons/FeedbackUp";
import { Exit } from "../../../Icons/Exit";
import { useTranslate } from "../../../hooks";
import styles from "./Sidebar.module.scss";

export const TABS = {
    PODIUM: "podium",
    SUMMARY: "summary",
    FEEDBACK: "feedback",
};

export function Sidebar({ activeTab, onTabChange, onRestart, isRestarting = false, onExit, revealed = true }) {
    const t = useTranslate();

    const tabs = [
        { id: TABS.PODIUM, label: t("common.multiplayer.podium.podium"), Icon: Cup },
        { id: TABS.SUMMARY, label: t("common.multiplayer.podium.summary"), Icon: Report },
        { id: TABS.FEEDBACK, label: t("common.multiplayer.podium.feedback"), Icon: FeedbackUp },
    ];

    return (
        <aside className={clsx(styles.sidebar, !revealed && styles.sidebarHidden)} aria-hidden={!revealed}>
            <button
                type="button"
                className={clsx(styles.restartButton, isRestarting && styles.restartButtonLoading)}
                onClick={onRestart}
                disabled={isRestarting}
                aria-busy={isRestarting}
            >
                <Restart />
                <span>{t("common.multiplayer.podium.restart")}</span>
            </button>

            <div className={styles.tabsCard}>
                {tabs.map(({ id, label, Icon }) => (
                    <button
                        key={id}
                        type="button"
                        className={clsx(styles.tab, activeTab === id && styles.tabActive)}
                        onClick={() => onTabChange(id)}
                    >
                        <Icon className={styles.tabIcon} />
                        <span>{label}</span>
                    </button>
                ))}
            </div>

            <button type="button" className={styles.exitButton} onClick={onExit}>
                <Exit className={styles.exitIcon} />
                <span>{t("common.multiplayer.podium.exit")}</span>
            </button>
        </aside>
    );
}
