import {
    FloatingFocusManager,
    autoUpdate,
    useClick,
    useDismiss,
    useFloating,
    useInteractions,
    useRole
} from "@floating-ui/react";
import React, { forwardRef, useImperativeHandle, useState } from "react";
import { flip, shift, size } from "@floating-ui/react-dom";
import classes from "./Dropdown.module.scss";
import PropTypes from "prop-types";
import { DropdownContext } from "./DropdownContext";

const Dropdown = forwardRef(function Dropdown({ children, toggle, matchToggleWidth = true }, ref) {
    const [isOpen, setIsOpen] = useState(false);

    useImperativeHandle(ref, () => ({
        open() {
            setIsOpen(true);
        },
        close() {
            setIsOpen(false);
        }
    }));

    // shift() mantiene el menú dentro del viewport (clave en móvil cuando
    // el toggle está pegado al borde). size() solo se aplica si el consumidor
    // quiere igualar el ancho del menú al del toggle (caso AudioComponentControl);
    // si el contenido es más ancho que el toggle hay que pasar matchToggleWidth=false
    // para que el menú se dimensione por su contenido y no se desborde.
    const middleware = [flip(), shift({ padding: 8 })];
    if (matchToggleWidth) {
        middleware.push(size({
            apply({ rects, elements }) {
                Object.assign(elements.floating.style, {
                    width: `${rects.reference.width}px`,
                })
            }
        }));
    }

    const { x, y, refs, strategy, context } = useFloating({
        whileElementsMounted: autoUpdate,
        open: isOpen,
        placement: "bottom-end",
        middleware,
        onOpenChange: setIsOpen
    });

    const { getReferenceProps, getFloatingProps } = useInteractions([
        useClick(context),
        useRole(context, { role: "menu" }),
        useDismiss(context)
    ]);

    return (
        <DropdownContext.Provider value={{ isOpen, setIsOpen, reference: refs.setReference, getReferenceProps }}>
            {toggle}

            {isOpen && (
                <FloatingFocusManager context={context}>
                    <div {...getFloatingProps({
                        ref: refs.setFloating,
                        style: {
                            position: strategy,
                            top: y ?? 0,
                            left: x ?? 0,
                            zIndex: "var(--z-index-dropdown)",
                        }
                    })}>
                        <div className={classes.list}>
                            {children}
                        </div>
                    </div>
                </FloatingFocusManager>
            )}
        </DropdownContext.Provider>
    );
});

export default Dropdown;

Dropdown.propTypes = {
    children: PropTypes.node.isRequired,
    toggle: PropTypes.node.isRequired,
    matchToggleWidth: PropTypes.bool,
};


