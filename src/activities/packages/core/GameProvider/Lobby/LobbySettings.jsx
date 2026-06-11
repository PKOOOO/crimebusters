import { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { updateSettings, uploadMatchBackground, deleteMatchBackground, getInterfaceTexts } from '@educaplay/core/services/multiplayer';
import { useTranslate } from '@educaplay/core/hooks';
import { Options } from '@educaplay/core/Icons/Options';
import { ImageAdd } from '@educaplay/core/Icons/ImageAdd';
import { Close } from '@educaplay/core/Icons/Close';
import { Select } from '../../components/Select';
import { mergeSettingsCatalog, buildDefaultSettings } from './settingsCatalog';
import { PremiumDialog } from './PremiumDialog';
import styles from './Lobby.module.scss';

// Comprueba si la licencia actual cubre el nivel premium requerido (paridad
// con premiumPermission del editor). `needed===true` admite cualquier licencia
// de pago; numérico exige license>=needed
function hasPremium(needed, license) {
    if (needed === undefined || needed === null) return true;
    const current = Number(license ?? 0);
    if (needed === true) return current > 0;
    return current >= Number(needed);
}

const BACKGROUND_ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];
const BACKGROUND_MAX_SIZE = 5 * 1024 * 1024;

// Panel de opciones del host. Muestra una lista declarativa de settings
// fusionando el catálogo core con el específico del juego. El juego puede
// declarar su catálogo en initialize({ multiplayerSettings: { catalog, disabledCoreSettings } })
// y se recoge desde state.game.multiplayerSettings
export function LobbySettings({ open, onClose }) {
    const t = useTranslate();
    const serverSettings = useSelector(state => state.multiplayer.settings);
    const gameSettings = useSelector(state => state.game.multiplayerSettings);
    const matchId = useSelector(state => state.multiplayer.match?.id);
    const hostLicense = useSelector(state => state.multiplayer.hostLicense);
    const interfaceLanguages = useSelector(state => state.multiplayer.interfaceLanguages);
    const activityLang = useSelector(state => state.multiplayer.match?.activityLang);
    const activityType = useSelector(state => state.multiplayer.match?.activityType);
    const [premiumPrompt, setPremiumPrompt] = useState(false);

    const catalog = useMemo(() => {
        const merged = mergeSettingsCatalog({
            gameCatalog: gameSettings?.catalog ?? [],
            disabledCoreSettings: gameSettings?.disabledCoreSettings ?? [],
        });
        // Selector de idioma de la interfaz (opción avanzada del host). Las
        // opciones (idiomas con traducción de multijugador) y el default (idioma
        // de la actividad) son dinámicos, así que la entrada se construye aquí en
        // vez de en el catálogo estático.
        if (Array.isArray(interfaceLanguages) && interfaceLanguages.length > 0) {
            merged.push({
                key: 'interfaceLanguage',
                label: 'common.multiplayer.settings.interfaceLanguage',
                type: 'select',
                default: activityLang ?? '',
                options: interfaceLanguages,
            });
        }
        return merged;
    }, [gameSettings?.catalog, gameSettings?.disabledCoreSettings, interfaceLanguages, activityLang]);

    // Prefetch por hover/foco de una opción de idioma: calienta la caché HTTP del
    // bundle justo del idioma que el host está a punto de elegir, para que el swap
    // se sienta instantáneo sin descargar todos los idiomas por adelantado.
    const preloadedRef = useRef(new Set());
    const handleLanguagePreload = useCallback((lang) => {
        if (!lang || lang === activityLang || !activityType) return;
        if (preloadedRef.current.has(lang)) return;
        preloadedRef.current.add(lang);
        getInterfaceTexts(lang, activityType).catch(() => {
            preloadedRef.current.delete(lang);
        });
    }, [activityLang, activityType]);

    const defaults = useMemo(() => buildDefaultSettings(catalog), [catalog]);
    const effective = useMemo(() => ({ ...defaults, ...(serverSettings ?? {}) }), [defaults, serverSettings]);

    // Estado local optimista: el usuario cambia un valor, se envía al servidor
    // y el broadcast settingsUpdated reconcilia. Si falla, revertimos
    const [local, setLocal] = useState(effective);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        setLocal(effective);
    }, [effective]);

    // Cierre con tecla Escape, mismo patrón que Settings del juego
    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.keyCode === 27) onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    const handleChange = useCallback(async (key, value) => {
        const previous = local[key];
        setLocal((prev) => ({ ...prev, [key]: value }));
        setSaving(true);
        try {
            await updateSettings({ [key]: value });
        } catch (e) {
            setLocal((prev) => ({ ...prev, [key]: previous }));
        } finally {
            setSaving(false);
        }
    }, [local]);

    return (
        <>
            {/* backdrop oscurecido con fade-in/out */}
            <AnimatePresence initial={false}>
                {open && (
                    <motion.div
                        className={styles.lobbySettingsBackdrop}
                        onClick={onClose}
                        animate={{ opacity: ['0%', '100%'] }}
                        transition={{ duration: 0.4 }}
                        exit={{ opacity: '0%' }}
                    />
                )}
            </AnimatePresence>

            {/* container que entra desde la derecha con rebote */}
            <motion.div
                className={styles.lobbySettingsContainer}
                animate={{ x: open ? ['100%', '-2%', '0%'] : '100%' }}
                initial={{ x: '100%' }}
                transition={{
                    duration: 0.4,
                    ease: 'easeIn',
                    times: [0, 0.7, 1],
                }}
            >
                <div className={styles.lobbySettingsPanel}>
                    <header className={styles.lobbySettingsHeader}>
                        <div className={styles.lobbySettingsHeaderTitle}>
                            <Options className={styles.lobbySettingsHeaderIcon} />
                            <h3>{t('common.multiplayer.settings.title')}</h3>
                        </div>
                        <button
                            type="button"
                            className={styles.lobbySettingsClose}
                            onClick={onClose}
                            aria-label={t('common.multiplayer.settings.close')}
                        >
                            <Close className={styles.lobbySettingsCloseIcon} />
                        </button>
                    </header>

                    <ul className={styles.lobbySettingsList}>
                        {catalog.map((item) => {
                            const isFile = item.type === 'image';
                            const premiumLocked = !hasPremium(item.premiumNeeded, hostLicense);
                            const optionClass = `${styles.lobbySettingsOption}${isFile ? ` ${styles.lobbySettingsOptionFile}` : ''}${saving ? ` ${styles.lobbySettingsOptionDisabled}` : ''}`;
                            return (
                                <li key={item.key} className={optionClass}>
                                    <div className={styles.lobbySettingsOptionInfo}>
                                        <div className={styles.lobbySettingsOptionHd}>
                                            <span className={styles.lobbySettingsOptionTitle}>{t(item.label)}</span>
                                        </div>
                                    </div>
                                    <SettingControl
                                        item={item}
                                        value={local[item.key] ?? item.default}
                                        disabled={saving}
                                        matchId={matchId}
                                        premiumLocked={premiumLocked}
                                        ariaLabel={t(item.label)}
                                        onPremiumBlocked={() => setPremiumPrompt(true)}
                                        onChange={(value) => handleChange(item.key, value)}
                                        onOptionPreload={item.key === 'interfaceLanguage' ? handleLanguagePreload : undefined}
                                    />
                                </li>
                            );
                        })}
                    </ul>
                </div>
            </motion.div>

            <PremiumDialog
                open={premiumPrompt}
                onClose={() => setPremiumPrompt(false)}
            />
        </>
    );
}

function SettingControl({ item, value, disabled, matchId, premiumLocked, ariaLabel, onPremiumBlocked, onChange, onOptionPreload }) {
    if (item.type === 'toggle') {
        // Mimics .e-check.e-check--switch.e-check--dark
        return (
            <div
                className={`${styles.lobbySettingsSwitch} ${styles.lobbySettingsSwitchDark}`}
                onClickCapture={(e) => {
                    if (premiumLocked) {
                        e.preventDefault();
                        e.stopPropagation();
                        onPremiumBlocked?.();
                    }
                }}
            >
                <input
                    type="checkbox"
                    checked={!!value}
                    disabled={disabled || premiumLocked}
                    onChange={(e) => onChange(e.target.checked)}
                />
            </div>
        );
    }
    if (item.type === 'select') {
        // Dropdown del design system (.e-select--dropdown). El gate premium se
        // aplica en el wrapper con onClickCapture, igual que en el toggle.
        return (
            <div
                className={styles.lobbySettingsSelectWrapper}
                onClickCapture={(e) => {
                    if (premiumLocked) {
                        e.preventDefault();
                        e.stopPropagation();
                        onPremiumBlocked?.();
                    }
                }}
            >
                <Select
                    options={item.options ?? []}
                    value={value}
                    disabled={disabled || premiumLocked}
                    ariaLabel={ariaLabel}
                    onChange={onChange}
                    onOptionPreload={onOptionPreload}
                />
            </div>
        );
    }
    if (item.type === 'image') {
        return (
            <ImageSettingControl
                value={value}
                disabled={disabled}
                matchId={matchId}
                premiumLocked={premiumLocked}
                onPremiumBlocked={onPremiumBlocked}
            />
        );
    }
    return null;
}

// Control de imagen: drag-and-drop o click para elegir. El fichero se sube al
// endpoint REST del match; el nuevo valor del setting llega por broadcast
// settingsUpdated (no se setea localmente para evitar divergencias con los
// players)
function ImageSettingControl({ value, disabled, matchId, premiumLocked, onPremiumBlocked }) {
    const t = useTranslate();
    const inputRef = useRef(null);
    const [uploading, setUploading] = useState(false);
    const [dragging, setDragging] = useState(false);
    const [error, setError] = useState(null);

    const handleFile = useCallback(async (file) => {
        if (!file) return;
        setError(null);
        if (!BACKGROUND_ACCEPTED_TYPES.includes(file.type)) {
            setError(t('common.multiplayer.settings.invalidFormat'));
            return;
        }
        if (file.size > BACKGROUND_MAX_SIZE) {
            setError(t('common.multiplayer.settings.imageTooLarge'));
            return;
        }
        if (!matchId) {
            setError(t('common.multiplayer.settings.noMatch'));
            return;
        }
        setUploading(true);
        try {
            await uploadMatchBackground(matchId, file);
        } catch (e) {
            setError(t('common.multiplayer.settings.uploadFailed'));
        } finally {
            setUploading(false);
        }
    }, [matchId, t]);

    const handleSelect = useCallback((e) => {
        const file = e.target.files?.[0];
        handleFile(file);
        e.target.value = '';
    }, [handleFile]);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragging(false);
        if (premiumLocked) {
            onPremiumBlocked?.();
            return;
        }
        const file = e.dataTransfer.files?.[0];
        handleFile(file);
    }, [handleFile, premiumLocked, onPremiumBlocked]);

    const handleDragOver = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragging(true);
    }, []);

    const handleDragLeave = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragging(false);
    }, []);

    const handleRemove = useCallback(async (e) => {
        e.stopPropagation();
        if (!matchId) return;
        setError(null);
        setUploading(true);
        try {
            await deleteMatchBackground(matchId);
        } catch (err) {
            setError(t('common.multiplayer.settings.removeFailed'));
        } finally {
            setUploading(false);
        }
    }, [matchId, t]);

    const handleClick = useCallback(() => {
        if (disabled || uploading) return;
        if (premiumLocked) {
            onPremiumBlocked?.();
            return;
        }
        inputRef.current?.click();
    }, [disabled, uploading, premiumLocked, onPremiumBlocked]);

    const hasImage = !!value;
    const isBusy = disabled || uploading;

    // Mimics .e-form.e-form--file (dropzone + preview)
    return (
        <div className={styles.lobbySettingsFile}>
            <div
                className={`${styles.lobbySettingsFileDropzone} ${dragging ? styles.lobbySettingsFileDropzoneDragover : ''} ${isBusy ? styles.lobbySettingsFileDropzoneDisabled : ''}`}
                onClick={handleClick}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragEnter={handleDragOver}
                onDragLeave={handleDragLeave}
                role="button"
                tabIndex={0}
            >
                <ImageAdd className={styles.lobbySettingsFileIcon} />
                <div className={styles.lobbySettingsFileBody}>
                    <span className={styles.lobbySettingsFileTitle}>
                        {uploading ? t('common.multiplayer.settings.uploading') : t('common.multiplayer.settings.dropOrClick')}
                    </span>
                    <span className={styles.lobbySettingsFileInfo}>{t('common.multiplayer.settings.imageInfo')}</span>
                </div>
                <input
                    ref={inputRef}
                    type="file"
                    accept={BACKGROUND_ACCEPTED_TYPES.join(',')}
                    onChange={handleSelect}
                    disabled={isBusy}
                    className={styles.lobbySettingsFileInput}
                />
            </div>
            {hasImage && (
                <div className={styles.lobbySettingsFilePreview}>
                    <img src={value} alt={t('common.multiplayer.settings.background')} />
                    <button
                        type="button"
                        className={styles.lobbySettingsFileRemove}
                        onClick={handleRemove}
                        disabled={isBusy}
                        aria-label={t('common.multiplayer.settings.removeImage')}
                    >
                        ×
                    </button>
                </div>
            )}
            {error && <span className={styles.lobbySettingsFileError}>{error}</span>}
        </div>
    );
}
