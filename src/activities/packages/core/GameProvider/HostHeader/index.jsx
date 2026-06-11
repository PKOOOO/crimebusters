import { useSelector } from 'react-redux';
import clsx from 'clsx';
import { getInitials, getAvatarColor, resolveAvatarSrc } from '@educaplay/core/utils';
import { EducaplayLogo } from '../EducaplayLogo';
import styles from './HostHeader.module.scss';

export function HostHeader({ className, overlay = false, showTitle = true }) {
    const title = useSelector(state => state.game.title);
    const user = useSelector(state => state.game.user);

    return (
        <header className={clsx(styles.header, overlay && styles.overlay, className)}>
            <div className={clsx(styles.side, styles.left)}>
                <EducaplayLogo className={styles.logo} />
            </div>

            {showTitle && <h1 className={styles.title}>{title}</h1>}

            <div className={clsx(styles.side, styles.right)}>
                {user && (() => {
                    const avatarSrc = resolveAvatarSrc(user.image);
                    return avatarSrc
                        ? <img src={avatarSrc} alt={user.name} className={styles.avatar} />
                        : (
                            <div
                                className={styles.avatarPlaceholder}
                                style={{ backgroundColor: getAvatarColor(user.name) }}
                            >
                                {getInitials(user.name)}
                            </div>
                        );
                })()}
            </div>
        </header>
    );
}
