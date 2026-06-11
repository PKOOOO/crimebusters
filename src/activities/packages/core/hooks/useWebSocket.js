import { useContext } from "react";
import { WebSocketContext } from "../GameProvider/WebSocketProvider/WebSocketContext";

export function useWebSocket() {
    const context = useContext(WebSocketContext);

    if (!context) {
        throw new Error("useWebSocket must be used within a WebSocketProvider");
    }

    return context;
}
