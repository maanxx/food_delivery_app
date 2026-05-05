"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.emitMessageRecalled = exports.emitMessageDeletedForEveryone = exports.emitMessageDeletedForMe = exports.emitConversationUpdated = exports.emitMessageToConversation = exports.initializeWebSocket = void 0;
const socket_io_1 = require("socket.io");
const jwt_1 = require("../utils/jwt");
const initializeWebSocket = (server) => {
    const io = new socket_io_1.Server(server, {
        cors: {
            origin: "*",
            credentials: true,
        },
        transports: ["websocket", "polling"],
    });
    io.use((socket, next) => {
        try {
            const token = socket.handshake.auth.token;
            if (!token) {
                return next(new Error("Authentication token required"));
            }
            const payload = jwt_1.JWTUtils.verifyAccessToken(token);
            socket.userId = payload.userId;
            socket.user = payload;
            next();
        }
        catch (error) {
            next(new Error("Invalid token"));
        }
    });
    io.on("connection", (socket) => {
        const userId = socket.userId;
        console.log(`[WS] ✅ User ${userId} connected: ${socket.id}`);
        // Each user joins their personal room for targeted delivery
        socket.join(`user:${userId}`);
        console.log(`[WS] User ${userId} joined personal room user:${userId}`);
        socket.on("join_conversation", (conversationId) => {
            const roomName = `conversation_${conversationId}`;
            socket.join(roomName);
            console.log(`[WS] User ${userId} joined conversation room: ${roomName}`);
            socket.to(roomName).emit("user_online", {
                userId,
                conversationId,
                timestamp: new Date().toISOString(),
            });
        });
        socket.on("leave_conversation", (conversationId) => {
            const roomName = `conversation_${conversationId}`;
            socket.leave(roomName);
            console.log(`[WS] User ${userId} left conversation room: ${roomName}`);
            socket.to(roomName).emit("user_offline", {
                userId,
                conversationId,
                timestamp: new Date().toISOString(),
            });
        });
        socket.on("typing", (data) => {
            const { conversationId } = data;
            const roomName = `conversation_${conversationId}`;
            socket.to(roomName).emit("user_typing", {
                userId,
                conversationId,
                timestamp: new Date().toISOString(),
            });
        });
        socket.on("stop_typing", (data) => {
            const { conversationId } = data;
            const roomName = `conversation_${conversationId}`;
            socket.to(roomName).emit("user_stop_typing", {
                userId,
                conversationId,
                timestamp: new Date().toISOString(),
            });
        });
        socket.on("disconnect", (reason) => {
            console.log(`[WS] ❌ User ${userId} disconnected: ${socket.id} (reason: ${reason})`);
        });
        socket.on("error", (error) => {
            console.error(`[WS] Socket error for user ${userId}:`, error);
        });
    });
    return io;
};
exports.initializeWebSocket = initializeWebSocket;
/**
 * Emits a new_message to everyone in the conversation room.
 * This covers User B if they are currently inside the chat detail screen.
 */
const emitMessageToConversation = (io, conversationId, message) => {
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
exports.emitMessageToConversation = emitMessageToConversation;
/**
 * Emits conversation_updated to each member's personal room (user:<userId>).
 * This covers User B even if they are on the chat LIST screen (not inside the chat room).
 * Also emits new_message to personal rooms for fallback delivery when not in the conversation room.
 */
const emitConversationUpdated = (io, conversationId, memberIds, conversationData) => {
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
exports.emitConversationUpdated = emitConversationUpdated;
/**
 * Emits message_deleted_for_me to a specific user's personal room.
 */
const emitMessageDeletedForMe = (io, conversationId, messageId, userId) => {
    const userRoom = `user:${userId}`;
    const payload = {
        conversationId,
        messageId,
        timestamp: new Date().toISOString(),
    };
    console.log(`[WS] Emitting message_deleted_for_me to user room ${userRoom}`, payload);
    io.to(userRoom).emit("message_deleted_for_me", payload);
};
exports.emitMessageDeletedForMe = emitMessageDeletedForMe;
/**
 * Emits message_deleted_for_everyone to the conversation room.
 */
const emitMessageDeletedForEveryone = (io, conversationId, messageId) => {
    const roomName = `conversation_${conversationId}`;
    const payload = {
        conversationId,
        messageId,
        timestamp: new Date().toISOString(),
    };
    console.log(`[WS] Emitting message_deleted_for_everyone to room ${roomName}`, payload);
    io.to(roomName).emit("message_deleted_for_everyone", payload);
};
exports.emitMessageDeletedForEveryone = emitMessageDeletedForEveryone;
/**
 * Emits message_recalled to the conversation room.
 */
const emitMessageRecalled = (io, conversationId, messageId) => {
    const roomName = `conversation_${conversationId}`;
    const payload = {
        conversationId,
        messageId,
        timestamp: new Date().toISOString(),
    };
    console.log(`[WS] Emitting message_recalled to room ${roomName}`, payload);
    io.to(roomName).emit("message_recalled", payload);
};
exports.emitMessageRecalled = emitMessageRecalled;
