import { Server as SocketIOServer } from "socket.io";
import { Server as HttpServer } from "http";
import { JWTUtils } from "../utils/jwt";

export const initializeWebSocket = (server: HttpServer) => {
    const io = new SocketIOServer(server, {
        cors: {
            origin: process.env.NODE_ENV === "production" ? ["http://localhost:8081"] : "*",
            credentials: true,
        },
        transports: ["websocket", "polling"],
    });

    io.use((socket: any, next) => {
        try {
            const token = socket.handshake.auth.token;
            if (!token) {
                return next(new Error("Authentication token required"));
            }

            const payload = JWTUtils.verifyAccessToken(token);
            socket.userId = payload.userId;
            socket.user = payload;
            next();
        } catch (error) {
            next(new Error("Invalid token"));
        }
    });

    io.on("connection", (socket: any) => {
        const userId = socket.userId;
        console.log(`✅ User ${userId} connected: ${socket.id}`);

        socket.join(`user:${userId}`);

        socket.on("join_conversation", (conversationId: string) => {
            const roomName = `conversation_${conversationId}`;
            socket.join(roomName);
            
            io.to(roomName).emit("user_online", {
                userId,
                conversationId,
                timestamp: new Date().toISOString(),
            });
        });

        socket.on("leave_conversation", (conversationId: string) => {
            const roomName = `conversation_${conversationId}`;
            socket.leave(roomName);

            io.to(roomName).emit("user_offline", {
                userId,
                conversationId,
                timestamp: new Date().toISOString(),
            });
        });

        socket.on("typing", (data: any) => {
            const { conversationId } = data;
            const roomName = `conversation_${conversationId}`;
            socket.to(roomName).emit("user_typing", {
                userId,
                conversationId,
                timestamp: new Date().toISOString(),
            });
        });

        socket.on("stop_typing", (data: any) => {
            const { conversationId } = data;
            const roomName = `conversation_${conversationId}`;
            socket.to(roomName).emit("user_stop_typing", {
                userId,
                conversationId,
                timestamp: new Date().toISOString(),
            });
        });

        socket.on("disconnect", () => {
            console.log(`❌ User ${userId} disconnected: ${socket.id}`);
        });

        socket.on("error", (error: any) => {
            console.error(`Socket error for user ${userId}:`, error);
        });
    });

    return io;
};

export const emitMessageToConversation = (io: SocketIOServer, conversationId: string, message: any) => {
    const roomName = `conversation_${conversationId}`;
    io.to(roomName).emit("new_message", {
        ...message,
        timestamp: new Date().toISOString(),
    });
};

export const emitConversationUpdated = (io: SocketIOServer, conversationId: string, memberIds: string[], conversationData: any) => {
    for (const memberId of memberIds) {
        const userRoom = `user:${memberId}`;
        io.to(userRoom).emit("conversation_updated", {
            conversationId,
            lastMessage: conversationData.lastMessage || null,
            lastMessageTimestamp: conversationData.lastMessageTimestamp,
            lastMessageId: conversationData.lastMessageId,
            unreadCount: conversationData.unreadCount,
            timestamp: new Date().toISOString(),
        });
    }
};
