import { io, Socket } from "socket.io-client";
import AsyncStorage from "@react-native-async-storage/async-storage";
import API_CONFIG from "../configs/api";

class SocketService {
    private socket: Socket | null = null;
    private listeners: Map<string, Function[]> = new Map();

    async connect() {
        if (this.socket?.connected) return;

        const token = await AsyncStorage.getItem("access_token");
        if (!token) return;

        this.socket = io(API_CONFIG.BASE_URL, {
            auth: { token },
            transports: ["websocket", "polling"],
        });

        this.socket.on("connect", () => {
            console.log("WebSocket connected:", this.socket?.id);
        });

        this.socket.on("disconnect", () => {
            console.log("WebSocket disconnected");
        });

        // Forward events to listeners
        const events = ["new_message", "user_online", "user_offline", "user_typing", "user_stop_typing", "conversation_updated"];
        
        events.forEach((event) => {
            this.socket?.on(event, (data) => {
                const eventListeners = this.listeners.get(event) || [];
                eventListeners.forEach((listener) => listener(data));
            });
        });
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }

    joinConversation(conversationId: string) {
        this.socket?.emit("join_conversation", conversationId);
    }

    leaveConversation(conversationId: string) {
        this.socket?.emit("leave_conversation", conversationId);
    }

    emitTyping(conversationId: string) {
        this.socket?.emit("typing", { conversationId });
    }

    emitStopTyping(conversationId: string) {
        this.socket?.emit("stop_typing", { conversationId });
    }

    on(event: string, callback: Function) {
        const eventListeners = this.listeners.get(event) || [];
        eventListeners.push(callback);
        this.listeners.set(event, eventListeners);
    }

    off(event: string, callback: Function) {
        const eventListeners = this.listeners.get(event) || [];
        const filteredListeners = eventListeners.filter((listener) => listener !== callback);
        this.listeners.set(event, filteredListeners);
    }
}

export default new SocketService();
