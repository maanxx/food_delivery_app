import { io, Socket } from "socket.io-client";
import AsyncStorage from "@react-native-async-storage/async-storage";
import API_CONFIG from "../configs/api";

class SocketService {
    private socket: Socket | null = null;
    private listeners: Map<string, Function[]> = new Map();
    private isConnecting: boolean = false;
    private pendingRooms: string[] = [];

    async connect() {
        // If already connected, nothing to do
        if (this.socket?.connected) {
            console.log("[Socket] Already connected:", this.socket.id);
            return;
        }

        // If a connection attempt is already in progress, wait for it
        if (this.isConnecting) {
            console.log("[Socket] Connection already in progress, skipping duplicate connect()");
            return;
        }

        const token = await AsyncStorage.getItem("access_token");
        if (!token) {
            console.warn("[Socket] No access_token found, cannot connect");
            return;
        }

        // Clean up any stale socket
        if (this.socket) {
            this.socket.removeAllListeners();
            this.socket.disconnect();
            this.socket = null;
        }

        this.isConnecting = true;
        console.log("[Socket] Connecting to", API_CONFIG.SOCKET_URL);

        this.socket = io(API_CONFIG.SOCKET_URL, {
            auth: { token },
            transports: ["websocket", "polling"],
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
        });

        this.socket.on("connect", () => {
            this.isConnecting = false;
            console.log("[Socket] ✅ Connected:", this.socket?.id);

            // Re-join any pending rooms after reconnection
            if (this.pendingRooms.length > 0) {
                console.log("[Socket] Rejoining pending rooms:", this.pendingRooms);
                this.pendingRooms.forEach((roomId) => {
                    this.socket?.emit("join_conversation", roomId);
                });
            }
        });

        this.socket.on("disconnect", (reason) => {
            this.isConnecting = false;
            console.log("[Socket] ❌ Disconnected:", reason);
        });

        this.socket.on("connect_error", (error) => {
            this.isConnecting = false;
            console.error("[Socket] Connection error:", error.message);
        });

        // Forward events to registered listeners
        const events = [
            "new_message",
            "user_online",
            "user_offline",
            "user_typing",
            "user_stop_typing",
            "conversation_updated",
            "message_deleted_for_me",
            "message_deleted_for_everyone",
            "message_recalled",
            "message_read",
            "message_edited",
            "reaction_added",
            "reaction_removed",
            "group_dissolved",
            "call_request",
            "call_response",
            "webrtc_signal",
            "call_ended",
        ];

        events.forEach((event) => {
            this.socket?.on(event, (data) => {
                console.log(`[Socket] Event received: ${event}`, data);
                const eventListeners = this.listeners.get(event) || [];
                eventListeners.forEach((listener) => listener(data));
            });
        });
    }

    disconnect() {
        if (this.socket) {
            console.log("[Socket] Disconnecting");
            this.socket.removeAllListeners();
            this.socket.disconnect();
            this.socket = null;
        }
        this.isConnecting = false;
        this.pendingRooms = [];
        this.listeners.clear();
        console.log("[Socket] Listeners cleared");
    }

    joinConversation(conversationId: string) {
        if (!conversationId) return;

        // Track this room so we can rejoin on reconnect
        if (!this.pendingRooms.includes(conversationId)) {
            this.pendingRooms.push(conversationId);
        }

        if (this.socket?.connected) {
            console.log("[Socket] Joining conversation room:", conversationId);
            this.socket.emit("join_conversation", conversationId);
        } else {
            console.log("[Socket] Not connected yet, room queued for join:", conversationId);
            // Will be joined in the connect callback above
        }
    }

    leaveConversation(conversationId: string) {
        if (!conversationId) return;
        this.pendingRooms = this.pendingRooms.filter((r) => r !== conversationId);

        if (this.socket?.connected) {
            console.log("[Socket] Leaving conversation room:", conversationId);
            this.socket.emit("leave_conversation", conversationId);
        }
    }

    emitTyping(conversationId: string) {
        this.socket?.emit("typing", { conversationId });
    }

    emitStopTyping(conversationId: string) {
        this.socket?.emit("stop_typing", { conversationId });
    }

    emitCallRequest(data: { conversationId: string, type: "voice" | "video", participants: string[] }) {
        this.socket?.emit("call_request", data);
    }

    emitCallResponse(data: { callId: string, status: "accepted" | "rejected" | "busy" }) {
        this.socket?.emit("call_response", data);
    }

    emitWebRTCSignal(data: { callId: string, signal: any, targetId?: string }) {
        this.socket?.emit("webrtc_signal", data);
    }

    emitCallEnd(data: { callId: string }) {
        this.socket?.emit("call_ended", data);
    }

    on(event: string, callback: Function) {
        const eventListeners = this.listeners.get(event) || [];
        // Prevent duplicate registration of the same function
        if (!eventListeners.includes(callback)) {
            eventListeners.push(callback);
            this.listeners.set(event, eventListeners);
        }
    }

    off(event: string, callback: Function) {
        const eventListeners = this.listeners.get(event) || [];
        const filtered = eventListeners.filter((listener) => listener !== callback);
        this.listeners.set(event, filtered);
    }

    isConnected(): boolean {
        return this.socket?.connected === true;
    }
}

export default new SocketService();
