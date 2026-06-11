import { CountdownLoading } from '../CountdownLoading';
import { HostHeader } from '../HostHeader';
import { assetsUrl } from '../../utils';
import styles from './Lobby.module.scss';

const defaultBgImage = assetsUrl('common/background.png');

export function Countdown({ onFinish, backgroundImage }) {
    const bgImage = backgroundImage || defaultBgImage;

    return (
        <div className={styles.countdown}>
            <img className={styles.countdownBackground} src={bgImage} alt="" />
            <HostHeader overlay />
            <div className={styles.countdownContent}>
                <CountdownLoading initialCount={3} onCountdownEnd={onFinish} />
            </div>
        </div>
    );
}
