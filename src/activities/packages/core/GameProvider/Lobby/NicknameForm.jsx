import { useState } from 'react';
import { useTranslate } from '@educaplay/core/hooks';
import styles from './Lobby.module.scss';

export function NicknameForm({ onSubmit }) {
    const t = useTranslate();
    const [nickname, setNickname] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (nickname.trim()) {
            onSubmit(nickname.trim());
        }
    };

    return (
        <div className={styles.nicknameForm}>
            <p className={styles.nicknameFormLabel}>{t('common.multiplayer.nickname.label')}</p>
            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    className={styles.nicknameFormInput}
                    placeholder={t('common.multiplayer.nickname.placeholder')}
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    maxLength={50}
                    autoFocus
                />
                <button
                    type="submit"
                    className={styles.nicknameFormButton}
                    disabled={!nickname.trim()}
                >
                    {t('common.multiplayer.nickname.submit')}
                </button>
            </form>
        </div>
    );
}
