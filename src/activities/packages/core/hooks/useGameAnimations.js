import { useContext } from "react";
import { GameAnimationsContext } from "../GameProvider/GameAnimationsProvider/GameAnimationsContext";

export function useGameAnimations() {
    const context = useContext(GameAnimationsContext);

    if (!context) {
        throw new Error("useGameAnimations must be used within a GameAnimationsProvider");
    }

    return context;
}