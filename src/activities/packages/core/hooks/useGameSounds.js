import { useContext } from "react";
import { GameSoundsContext } from "../GameProvider/GameSoundsProvider/GameSoundContext";

export function useGameSounds() {
    const context = useContext(GameSoundsContext);

    if (!context) {
        throw new Error("useGameASounds must be used within a GameSoundsProvider");
    }

    return context;
}