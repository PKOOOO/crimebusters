import { EducaplayLogo } from "../../EducaplayLogo";
import styles from "./ScorePanelHeader.module.scss";

// animated añade data-animate="logo"/"title" para que el Podio enganche la
// entrada con framer-motion sin duplicar markup ni estilos del header
export function ScorePanelHeader({ title, subtitle, SubtitleIcon, animated = false }) {
    return (
        <div className={styles.header}>
            <div className={styles.logo} {...(animated && { "data-animate": "logo" })}>
                <EducaplayLogo variant="games" />
            </div>

            <div className={styles.title} {...(animated && { "data-animate": "title" })}>
                <span className={styles.titleText}>{title}</span>
            </div>

            {subtitle && (
                <h3 className={styles.subtitle}>
                    {SubtitleIcon && <SubtitleIcon className={styles.subtitleIcon} />}
                    <span className={styles.subtitleText}>{subtitle}</span>
                </h3>
            )}
        </div>
    );
}
