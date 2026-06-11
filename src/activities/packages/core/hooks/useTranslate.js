import { useContext } from "react";
import { TranslateContext } from "../GameProvider/TranslateProvider/TranslateContext";

export function useTranslate() {
    const context = useContext(TranslateContext);

    if (!context) {
        throw new Error("useTranslate must be used within a TranslateProvider");
    }

    return context;
}