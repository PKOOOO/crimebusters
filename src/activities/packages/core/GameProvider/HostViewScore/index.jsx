import { useCallback, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import clsx from "clsx";
import { setFeedbackVisibility, revealPosition } from "../../services/multiplayer";
import { Sidebar, TABS } from "./Sidebar";
import { Podium } from "./Podium";
import { Summary } from "./Summary";
import { FeedbackPanel } from "./FeedbackPanel";
import { HostHeader } from "../HostHeader";
import styles from "./HostViewScore.module.scss";

export function HostViewScore({ ranking, title, backgroundImage, onRestart, isRestarting = false, onExit }) {
    const maxRevealedPosition = useSelector(state => state.multiplayer.maxRevealedPosition);
    // Capturamos skipPodiumIntro UNA SOLA VEZ al montar. Si lo recomputáramos
    // en cada render, la confirmación WS del propio revealPosition(1) (que
    // hace maxRevealedPosition = 1) flipearía skipIntro a true en mitad del
    // conteo del ganador, desmontando el <AnimatingNumber> de la posición 1
    // (el JSX pasa a un <span> estático). Su cleanup llama a springValue.stop()
    // y onAnimationComplete nunca se dispara, por lo que el waiter de la pos 1
    // queda colgado y el timeline no llega a setPodiumDone(true)
    const [skipPodiumIntro] = useState(() => maxRevealedPosition === 1);
    const [activeTab, setActiveTab] = useState(TABS.PODIUM);
    const [podiumDone, setPodiumDone] = useState(skipPodiumIntro);
    const feedbackVisible = useSelector(state => state.multiplayer.feedback.visible);

    // Sincronizamos la pestaña 'feedback' con el flag de visibilidad por WS:
    // si la valoración se abre/cierra desde otro lado (recarga, sync externo),
    // movemos el tab para mantener la coherencia visual
    useEffect(() => {
        if (feedbackVisible && activeTab !== TABS.FEEDBACK) {
            setActiveTab(TABS.FEEDBACK);
        } else if (!feedbackVisible && activeTab === TABS.FEEDBACK) {
            setActiveTab(TABS.PODIUM);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [feedbackVisible]);

    const handleTabChange = useCallback((nextTab) => {
        setActiveTab(prev => {
            if (prev === nextTab) return prev;
            if (prev === TABS.FEEDBACK && nextTab !== TABS.FEEDBACK) {
                setFeedbackVisibility(false).catch(() => {});
            }
            if (nextTab === TABS.FEEDBACK && prev !== TABS.FEEDBACK) {
                setFeedbackVisibility(true).catch(() => {});
            }
            return nextTab;
        });
    }, []);

    const handlePositionRevealed = useCallback((position) => {
        revealPosition(position).catch(() => {});
    }, []);

    const handlePodiumComplete = useCallback(() => {
        setPodiumDone(true);
    }, []);

    return (
        <div className={styles.container}>
            <HostHeader className={styles.header} showTitle={false} />

            <div className={clsx(styles.main, !podiumDone && styles.mainExpanded)} data-main-expanded={!podiumDone || undefined}>
                <div className={clsx(styles.panel, !podiumDone && styles.panelExpanded)}>
                    <div className={clsx(styles.panelView, activeTab === TABS.PODIUM && styles.panelViewActive)}>
                        <Podium
                            ranking={ranking}
                            title={title}
                            backgroundImage={backgroundImage}
                            onPositionRevealed={handlePositionRevealed}
                            onAnimationComplete={handlePodiumComplete}
                            skipIntro={skipPodiumIntro}
                            expanded={!podiumDone}
                        />
                    </div>
                    <div className={clsx(styles.panelView, activeTab === TABS.SUMMARY && styles.panelViewActive)}>
                        <Summary title={title} backgroundImage={backgroundImage} />
                    </div>
                    <div className={clsx(styles.panelView, activeTab === TABS.FEEDBACK && styles.panelViewActive)}>
                        <FeedbackPanel title={title} backgroundImage={backgroundImage} />
                    </div>
                </div>

                <Sidebar activeTab={activeTab} onTabChange={handleTabChange} onRestart={onRestart} isRestarting={isRestarting} onExit={onExit} revealed={podiumDone} />
            </div>
        </div>
    );
}
