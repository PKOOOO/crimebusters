import { useState, useCallback, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useSelector } from 'react-redux';
import { MATCH_URL } from '@educaplay/core/utils/constants';
import { useTranslate } from '@educaplay/core/hooks';
import QRCode from 'qrcode';
import styles from './Lobby.module.scss';

export function GamePin() {
    const t = useTranslate();
    const match = useSelector(state => state.multiplayer.match);
    const [copiedFrom, setCopiedFrom] = useState(null); // 'pin' | 'url' | null
    const [qrOpen, setQrOpen] = useState(false);
    const canvasRef = useRef(null);
    const popupCanvasRef = useRef(null);

    const joinUrl = `${MATCH_URL}${match?.pin}/`;

    const handleCopy = useCallback(() => {
        navigator.clipboard.writeText(match.pin).then(() => {
            setCopiedFrom('pin');
            setTimeout(() => setCopiedFrom(null), 1000);
        });
    }, [match?.pin]);

    const handleCopyUrl = useCallback(() => {
        navigator.clipboard.writeText(joinUrl).then(() => {
            setCopiedFrom('url');
            setTimeout(() => setCopiedFrom(null), 1000);
        });
    }, [joinUrl]);

    useEffect(() => {
        if (!canvasRef.current || !joinUrl) return;
        QRCode.toCanvas(canvasRef.current, joinUrl, {
            width: 512,
            margin: 2,
            color: { dark: '#000', light: '#fff' }
        });
    }, [joinUrl]);

    useEffect(() => {
        if (!qrOpen || !popupCanvasRef.current || !joinUrl) return;
        QRCode.toCanvas(popupCanvasRef.current, joinUrl, {
            width: 512,
            margin: 2,
            color: { dark: '#000', light: '#fff' }
        });
    }, [qrOpen, joinUrl]);

    useEffect(() => {
        if (!qrOpen) return;
        const onKey = (e) => {
            if (e.key === 'Escape') setQrOpen(false);
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [qrOpen]);

    if (!match) return null;

    return (
        <>
            <div className={styles.gamePin}>
                <div className={styles.gamePinInfo}>
                    <h2 className={styles.gamePinTitle}>
                        <span className={styles.gamePinTitleIcon} aria-hidden="true">
                            <svg width="30" height="30" viewBox="0 0 21 23" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path fillRule="evenodd" clipRule="evenodd" d="M8.76801 5.01654C4.08892 4.93486 0.229567 8.6618 0.147893 13.3409C0.0662193 18.02 3.79316 21.8793 8.47224 21.961C13.1513 22.0427 17.0107 18.3157 17.0924 13.6366C17.1241 11.8196 16.5814 10.1262 15.6317 8.7296L14.5033 9.81935C15.1893 10.917 15.5762 12.2191 15.5519 13.6098C15.4851 17.4381 12.3275 20.4874 8.49913 20.4206C4.67079 20.3538 1.62147 17.1961 1.6883 13.3678C1.75512 9.53943 4.91278 6.49012 8.74112 6.55694C10.0632 6.58002 11.2923 6.9717 12.3323 7.63231L13.4666 6.53699C12.1329 5.60537 10.5169 5.04706 8.76801 5.01654Z" fill="currentColor"/>
                                <path fillRule="evenodd" clipRule="evenodd" d="M12.4906 11.7629C12.7358 12.3118 12.8675 12.9219 12.8563 13.5627C12.8155 15.9022 10.8858 17.7657 8.54625 17.7248C6.20671 17.684 4.34324 15.7543 4.38408 13.4148C4.42492 11.0752 6.3546 9.21177 8.69414 9.25261C9.26378 9.26255 9.80519 9.38447 10.2978 9.59702L10.8905 9.02464C10.2342 8.69026 9.49361 8.49613 8.70758 8.48241C5.94267 8.43414 3.66214 10.6364 3.61388 13.4013C3.56562 16.1663 5.7679 18.4468 8.53281 18.495C11.2977 18.5433 13.5783 16.341 13.6265 13.5761C13.6415 12.7201 13.4407 11.9105 13.0743 11.1992L12.4906 11.7629Z" fill="currentColor"/>
                                <path fillRule="evenodd" clipRule="evenodd" d="M7.52949 12.3992C6.92783 13.0009 6.92783 13.9763 7.52949 14.578C7.7628 14.8113 8.05232 14.9541 8.35446 15.0065C8.44078 15.0215 8.52956 15.0293 8.62016 15.0293C9.06533 15.0293 9.4664 14.8405 9.74766 14.5386L10.9275 13.3587C10.9299 13.4018 10.9311 13.4451 10.9311 13.4887C10.9311 14.765 9.89647 15.7997 8.62016 15.7997C7.34386 15.7997 6.3092 14.765 6.3092 13.4887C6.3092 12.2124 7.34386 11.1777 8.62016 11.1777C8.66289 11.1777 8.70535 11.1789 8.74751 11.1812L7.52949 12.3992Z" fill="currentColor"/>
                                <line x1="8.62015" y1="13.3979" x2="17.1566" y2="4.86144" stroke="currentColor" strokeLinecap="round"/>
                                <path d="M14.1058 3.12705C14.1058 3.06075 14.1322 2.99716 14.1791 2.95027L16.4026 0.726781C16.56 0.56929 16.8293 0.680831 16.8293 0.903558V3.46464C16.8293 3.53095 16.803 3.59453 16.7561 3.64142L14.5326 5.86491C14.3751 6.0224 14.1058 5.91086 14.1058 5.68814V3.12705Z" fill="currentColor"/>
                                <path d="M20.5419 5.78742C20.7377 5.82658 20.8109 6.06815 20.6697 6.20934L18.3711 8.50791C18.312 8.56702 18.2273 8.59267 18.1453 8.57628L16.0111 8.14943C15.8153 8.11027 15.7421 7.8687 15.8833 7.72751L18.1819 5.42894C18.241 5.36983 18.3257 5.34418 18.4077 5.36057L20.5419 5.78742Z" fill="currentColor"/>
                            </svg>
                        </span>
                        {t('common.multiplayer.gamePin.titleAt')} <a href="https://game.educaplay.com" target="_blank" rel="noopener noreferrer">game.educaplay.com</a>
                    </h2>
                    <div className={styles.gamePinCode} onClick={handleCopy} title={t('common.multiplayer.gamePin.copyTitle')}>
                        <span className={styles.gamePinCodeIcon} aria-hidden="true">
                            <svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M10.0361 8.98848C13.6323 5.97102 18.9942 6.44021 22.0117 10.0363C25.0292 13.6325 24.56 18.9944 20.9639 22.0119C17.3677 25.0294 12.0058 24.5602 8.98828 20.9641C8.58784 20.4868 8.24883 19.9771 7.96973 19.4455C7.71302 18.9565 7.90162 18.3516 8.39062 18.0949C8.87943 17.8388 9.48359 18.0272 9.74023 18.5158C9.95311 18.9213 10.2129 19.3112 10.5205 19.6779C12.8279 22.4278 16.9278 22.7869 19.6777 20.4797C22.4276 18.1723 22.7867 14.0724 20.4795 11.3225C18.1721 8.57258 14.0722 8.21349 11.3223 10.5207C10.7906 10.9668 10.3489 11.4786 9.99902 12.0334C9.70447 12.5004 9.0872 12.6402 8.62012 12.3459C8.15318 12.0513 8.01317 11.4341 8.30762 10.967C8.76662 10.2391 9.34389 9.56934 10.0361 8.98848Z" fill="currentColor"/>
                                <path d="M11.9648 11.2863C14.2918 9.33422 17.7615 9.63827 19.7139 11.965C21.6658 14.2917 21.3623 17.7606 19.0361 19.7131C16.9845 21.4346 14.0465 21.4016 12.041 19.7766C11.6121 19.4289 11.5461 18.8003 11.8936 18.3713C12.2413 17.9422 12.8707 17.8761 13.2998 18.2238C14.5753 19.2572 16.4459 19.2751 17.75 18.1809C19.2304 16.9383 19.424 14.7308 18.1816 13.2502C16.9393 11.7697 14.7317 11.5767 13.251 12.8186C12.8279 13.1736 12.1968 13.1186 11.8418 12.6955C11.4868 12.2724 11.5418 11.6413 11.9648 11.2863Z" fill="currentColor"/>
                                <path fillRule="evenodd" clipRule="evenodd" d="M6 12.0002C7.3113 12.0002 8.42309 12.8425 8.83105 14.0148C8.886 14.0055 8.94239 14.0002 9 14.0002H15.5C16.3284 14.0002 17 14.6718 17 15.5002V17.0002C17 17.5525 16.5523 18.0002 16 18.0002C15.4477 18.0002 15 17.5525 15 17.0002V16.0002H13L12.9951 16.1027C12.9438 16.6069 12.5177 17.0002 12 17.0002C11.4823 17.0002 11.0562 16.6069 11.0049 16.1027L11 16.0002H9C8.94234 16.0002 8.88605 15.9939 8.83105 15.9846C8.42333 17.1573 7.31161 18.0002 6 18.0002C4.34315 18.0002 3.00001 16.657 3 15.0002C3 13.3433 4.34315 12.0002 6 12.0002ZM6 14.0002C5.44772 14.0002 5 14.4479 5 15.0002C5.00001 15.5525 5.44772 16.0002 6 16.0002C6.55228 16.0002 6.99999 15.5525 7 15.0002C7 14.4479 6.55228 14.0002 6 14.0002Z" fill="currentColor"/>
                            </svg>
                        </span>
                        {match.pin}
                        {copiedFrom === 'pin' && (
                            <span className={styles.gamePinCopiedBubble} role="alert" aria-hidden="true">
                                {t('common.multiplayer.gamePin.copied')}
                            </span>
                        )}
                    </div>
                    <div className={styles.gamePinUrlRow}>
                        <span className={styles.gamePinUrlLabel}>
                            {t('common.multiplayer.gamePin.joinAt')}
                        </span>
                        <div className={styles.gamePinUrl}>
                            <div className={styles.gamePinUrlWrapper}>
                                <span className={styles.gamePinUrlIcon} aria-hidden="true">
                                    <svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M13.7469 11.5926C15.2007 11.6969 16.5373 12.4287 17.41 13.5965C17.7403 14.0389 17.65 14.6654 17.2078 14.9959C16.7655 15.3264 16.138 15.2361 15.8074 14.7938C15.282 14.0906 14.4778 13.6504 13.6033 13.5877C12.729 13.5251 11.8699 13.8457 11.2498 14.4666L8.83673 16.8827C7.7029 18.0711 7.72326 19.9506 8.88556 21.1141C10.0477 22.2773 11.9236 22.2964 13.1102 21.161L14.4852 19.786C14.8754 19.3953 15.5085 19.395 15.8992 19.785C16.2899 20.1753 16.2905 20.8083 15.9002 21.1991L14.5242 22.576C14.5202 22.58 14.5166 22.5848 14.5125 22.5887C12.5416 24.4941 9.40798 24.4666 7.47052 22.5272C5.53378 20.5883 5.50624 17.4535 7.409 15.4813C7.41294 15.4772 7.41768 15.4736 7.4217 15.4696L9.83478 13.0535C10.865 12.022 12.293 11.4884 13.7469 11.5926Z" fill="currentColor"/>
                                        <path d="M15.4871 7.41097C17.458 5.50571 20.5917 5.53333 22.5291 7.4725C24.4659 9.41142 24.4926 12.5462 22.5897 14.5184C22.5857 14.5225 22.5819 14.5271 22.5779 14.5311L20.1639 16.9471C19.1337 17.9784 17.7064 18.5113 16.2528 18.4071C14.7991 18.3027 13.4623 17.5717 12.5897 16.4041C12.2593 15.9618 12.3497 15.3343 12.7918 15.0037C13.2341 14.6733 13.8606 14.7647 14.1912 15.2069C14.7166 15.9099 15.5221 16.3492 16.3963 16.4119C17.2705 16.4745 18.1288 16.1538 18.7488 15.533L21.1492 13.1297C22.2952 11.942 22.2805 10.0532 21.1141 8.88558C19.9482 7.71886 18.0636 7.70307 16.8778 8.84945L16.8768 8.84847L15.5037 10.2166C15.1122 10.6058 14.4791 10.604 14.0897 10.2127C13.7005 9.82139 13.7016 9.18821 14.0926 8.79867L15.4764 7.42171L15.4871 7.41097Z" fill="currentColor"/>
                                    </svg>
                                </span>
                                <div className={styles.gamePinUrlInput}>
                                    <input type="text" readOnly value={joinUrl} />
                                </div>
                                <span className={styles.gamePinUrlBtnWithMsg}>
                                    <button
                                        type="button"
                                        className={styles.gamePinUrlCopyBtn}
                                        onClick={handleCopyUrl}
                                        title={t('common.multiplayer.gamePin.copyTitle')}
                                    >
                                        <span className={styles.gamePinUrlBtnIcon} aria-hidden="true">
                                            <svg width="20" height="20" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path fillRule="evenodd" clipRule="evenodd" d="M20 11.9004C21.6566 11.9007 23 13.2437 23 14.9004V20C22.9998 21.6565 21.6565 22.9997 20 23H14.9004C13.2437 23 11.9006 21.6567 11.9004 20V14.9004C11.9004 13.2435 13.2435 11.9004 14.9004 11.9004H20ZM14.9004 13.9004C14.3481 13.9004 13.9004 14.3481 13.9004 14.9004V20C13.9006 20.5521 14.3482 21 14.9004 21H20C20.5519 20.9997 20.9998 20.552 21 20V14.9004C21 14.3483 20.5521 13.9007 20 13.9004H14.9004Z" fill="currentColor"/>
                                                <path d="M15.7002 7C17.0256 7.0001 18.0996 8.07497 18.0996 9.40039V10.0996C18.0996 10.6519 17.6519 11.0996 17.0996 11.0996C16.5475 11.0994 16.0996 10.6518 16.0996 10.0996V9.40039C16.0996 9.17954 15.921 9.0001 15.7002 9H9.40039C9.17948 9 9 9.17948 9 9.40039V15.7002C9.0001 15.921 9.17954 16.0996 9.40039 16.0996H10.0996C10.6518 16.0996 11.0994 16.5475 11.0996 17.0996C11.0996 17.6519 10.6519 18.0996 10.0996 18.0996H9.40039C8.07497 18.0996 7.0001 17.0256 7 15.7002V9.40039C7 8.07491 8.07491 7 9.40039 7H15.7002Z" fill="currentColor"/>
                                            </svg>
                                        </span>
                                    </button>
                                    {copiedFrom === 'url' && (
                                        <span className={styles.gamePinCopiedBubble} role="alert" aria-hidden="true">
                                            {t('common.multiplayer.gamePin.copied')}
                                        </span>
                                    )}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
                <div
                    className={styles.gamePinQrWrapper}
                    onClick={() => setQrOpen(true)}
                    role="button"
                    tabIndex={0}
                    title={t('common.multiplayer.gamePin.enlargeQr')}
                >
                    <canvas ref={canvasRef} className={styles.gamePinQr} />
                </div>
            </div>
            {qrOpen && createPortal(
                <div
                    className={styles.gamePinQrPopupBackdrop}
                    onClick={() => setQrOpen(false)}
                    role="dialog"
                    aria-modal="true"
                >
                    <div
                        className={styles.gamePinQrPopup}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <canvas ref={popupCanvasRef} className={styles.gamePinQr} />
                    </div>
                </div>,
                document.body
            )}
        </>
    );
}
