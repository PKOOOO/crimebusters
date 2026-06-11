import { useContext } from "react";
import { CustomHandlersContext } from ".";

export function useCustomHandlers() {
    const context = useContext(CustomHandlersContext);

    if (!context) {
        throw new Error("useCustomHandlers must be used within a CustomHandlersProvider");
    }

    return context;
}