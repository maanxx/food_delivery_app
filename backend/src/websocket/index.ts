import { Server as SocketIOServer } from "socket.io";
import { Server as HttpServer } from "http";
import { JWTUtils } from "../utils/jwt";

export const initializeWebSocket = (server: HttpServer) => {
    const io = new SocketIOServer(server, {
        cors: {
            origin: "*",
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
        console.log(`[WS] ✅ User ${userId} connected: ${socket.id}`);

        // Each user joins their personal room for targeted delivery
        socket.join(`user:${userId}`);
        console.log(`[WS] User ${userId} joined personal room user:${userId}`);

        socket.on("join_conversation", (conversationId: string) => {
            const roomName = `conversation_${conversationId}`;
            socket.join(roomName);
            console.log(`[WS] User ${userId} joined conversation room: ${roomName}`);

            socket.to(roomName).emit("user_online", {
                userId,
                conversationId,
                timestamp: new Date().toISOString(),
            });
        });

        socket.on("leave_conversation", (conversationId: string) => {
            const roomName = `conversation_${conversationId}`;
            socket.leave(roomName);
            console.log(`[WS] User ${userId} left conversation room: ${roomName}`);

            socket.to(roomName).emit("user_offline", {
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

        socket.on("disconnect", (reason: string) => {
            console.log(`[WS] ❌ User ${userId} disconnected: ${socket.id} (reason: ${reason})`);
        });

        socket.on("error", (error: any) => {
            console.error(`[WS] Socket error for user ${userId}:`, error);
        });
    });

    return io;
};

/**
 * Emits a new_message to everyone in the conversation room.
 * This covers User B if they are currently inside the chat detail screen.
 */
export const emitMessageToConversation = (
    io: SocketIOServer,
    conversationId: string,
    message: any
) => {
    const roomName = `conversation_${conversationId}`;
    const payload = {
        ...message,
        conversationId,
        timestamp: new Date().toISOString(),
    };

    console.log(`[WS] Emitting new_message to room ${roomName}`, {
        messageId: message.messageId,
        senderId: message.senderId,
        type: message.type,
    });

    io.to(roomName).emit("new_message", payload);
};

/**
 * Emits conversation_updated to each member's personal room (user:<userId>).
 * This covers User B even if they are on the chat LIST screen (not inside the chat room).
 * Also emits new_message to personal rooms for fallback delivery when not in the conversation room.
 */
export const emitConversationUpdated = (
    io: SocketIOServer,
    conversationId: string,
    memberIds: string[],
    conversationData: any
) => {
    for (const memberId of memberIds) {
        const userRoom = `user:${memberId}`;
        const payload = {
            conversationId,
            lastMessage: conversationData.lastMessage || null,
            lastMessageTimestamp: conversationData.lastMessageTimestamp,
            lastMessageId: conversationData.lastMessageId,
            unreadCount: conversationData.unreadCount,
            timestamp: new Date().toISOString(),
        };

        console.log(`[WS] Emitting conversation_updated to user room ${userRoom}`, {
            conversationId,
            unreadCount: conversationData.unreadCount,
        });

        io.to(userRoom).emit("conversation_updated", payload);

        // Also deliver the new_message to user's personal room.
        // This ensures User B receives the message even if they haven't joined
        // the conversation room yet (e.g., app just opened, not in chat screen).
        if (conversationData.lastMessage && conversationData.newMessage) {
            console.log(`[WS] Fallback: Emitting new_message to personal room ${userRoom}`);
            io.to(userRoom).emit("new_message", conversationData.newMessage);
        }
    }
};

/**
 * Emits message_deleted to the conversation room.
 */
export const emitMessageDeleted = (
    io: SocketIOServer,
    conversationId: string,
    messageId: string,
    deletedForEveryone: boolean,
    userId: string
) => {
    const roomName = `conversation_${conversationId}`;
    const payload = {
        conversationId,
        messageId,
        deletedForEveryone,
        userId, // who deleted it
        timestamp: new Date().toISOString(),
    };

    console.log(`[WS] Emitting message_deleted to room ${roomName}`, payload);
    io.to(roomName).emit("message_deleted", payload);
};

/**
 * Emits message_recalled to the conversation room.
 */
export const emitMessageRecalled = (
    io: SocketIOServer,
    conversationId: string,
    messageId: string
) => {
    const roomName = `conversation_${conversationId}`;
    const payload = {
        conversationId,
        messageId,
        timestamp: new Date().toISOString(),
    };

    console.log(`[WS] Emitting message_recalled to room ${roomName}`, payload);
    io.to(roomName).emit("message_recalled", payload);
};
