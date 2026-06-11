import { useCallback, useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import styles from './Select.module.scss';

// Dropdown custom que replica el componente .e-select--dropdown del design
// system (variante dark, pensada para paneles oscuros como el del lobby).
// Sustituye al <select> nativo para poder mostrar la lista con el estilo del DS.
// La fuente de verdad del diseño es src/scss/components/_e-select.scss; aquí se
// replican sus valores de token porque ese SCSS no es importable desde el build
// del monorepo de actividades (mismo patrón "mimic" que el switch del lobby).
export function Select({ options = [], value, onChange, disabled = false, ariaLabel, onOptionPreload }) {
    const [open, setOpen] = useState(false);
    const [highlighted, setHighlighted] = useState(-1);
    const rootRef = useRef(null);
    const triggerRef = useRef(null);
    const optionRefs = useRef([]);

    const selectedIndex = options.findIndex((o) => o.value === value);
    const selectedLabel = selectedIndex >= 0 ? options[selectedIndex].label : '';

    const openMenu = useCallback(() => {
        if (disabled) return;
        setHighlighted(selectedIndex >= 0 ? selectedIndex : 0);
        setOpen(true);
    }, [disabled, selectedIndex]);

    // Cerrar al hacer click fuera del componente.
    useEffect(() => {
        if (!open) return;
        const handlePointerDown = (e) => {
            if (rootRef.current && !rootRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener('pointerdown', handlePointerDown);
        return () => document.removeEventListener('pointerdown', handlePointerDown);
    }, [open]);

    // Al abrir o cambiar la opción resaltada, llevamos el foco a esa opción para
    // que el teclado (flechas/Enter) funcione sin gestionar aria-activedescendant.
    useEffect(() => {
        if (open && highlighted >= 0) {
            optionRefs.current[highlighted]?.focus();
        }
    }, [open, highlighted]);

    const selectOption = useCallback((option) => {
        if (option.disabled) return;
        onChange?.(option.value);
        setOpen(false);
        triggerRef.current?.focus();
    }, [onChange]);

    const handleTriggerKeyDown = useCallback((e) => {
        if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            openMenu();
        }
    }, [openMenu]);

    const moveHighlight = useCallback((delta) => {
        setHighlighted((prev) => {
            const count = options.length;
            if (count === 0) return -1;
            let next = prev;
            for (let i = 0; i < count; i++) {
                next = (next + delta + count) % count;
                if (!options[next]?.disabled) break;
            }
            return next;
        });
    }, [options]);

    const handleListKeyDown = useCallback((e) => {
        if (e.key === 'ArrowDown') { e.preventDefault(); moveHighlight(1); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); moveHighlight(-1); }
        else if (e.key === 'Escape') {
            // stopPropagation para que Escape cierre solo el dropdown y no el panel
            // de ajustes (que escucha Escape en window).
            e.preventDefault();
            e.stopPropagation();
            setOpen(false);
            triggerRef.current?.focus();
        }
        else if (e.key === 'Tab') { setOpen(false); }
    }, [moveHighlight]);

    return (
        <div ref={rootRef} className={`${styles.select} ${open ? styles.isOpen : ''}`}>
            <button
                ref={triggerRef}
                type="button"
                className={styles.trigger}
                disabled={disabled}
                aria-haspopup="listbox"
                aria-expanded={open}
                aria-label={ariaLabel}
                onClick={() => (open ? setOpen(false) : openMenu())}
                onKeyDown={handleTriggerKeyDown}
            >
                {selectedLabel}
            </button>
            {open && (
                <ul className={styles.list} role="listbox" onKeyDown={handleListKeyDown}>
                    {options.map((option, index) => {
                        const isActive = option.value === value;
                        const cls = `${styles.option}${isActive ? ` ${styles.optionActive}` : ''}${option.disabled ? ` ${styles.optionDisabled}` : ''}`;
                        return (
                            <li key={String(option.value)} role="none">
                                <button
                                    ref={(el) => { optionRefs.current[index] = el; }}
                                    type="button"
                                    role="option"
                                    aria-selected={isActive}
                                    className={cls}
                                    disabled={option.disabled}
                                    onClick={() => selectOption(option)}
                                    onMouseEnter={() => onOptionPreload?.(option.value)}
                                    onFocus={() => onOptionPreload?.(option.value)}
                                >
                                    <span className={styles.txt}>
                                        {option.label}
                                        {option.description && <span className={styles.desc}>{option.description}</span>}
                                    </span>
                                </button>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}

Select.propTypes = {
    options: PropTypes.arrayOf(PropTypes.shape({
        value: PropTypes.any.isRequired,
        label: PropTypes.node,
        description: PropTypes.node,
        disabled: PropTypes.bool,
    })),
    value: PropTypes.any,
    onChange: PropTypes.func,
    disabled: PropTypes.bool,
    ariaLabel: PropTypes.string,
    onOptionPreload: PropTypes.func,
};
