"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.emitConversationUpdated = exports.emitMessageToConversation = exports.initializeWebSocket = void 0;
const socket_io_1 = require("socket.io");
const jwt_1 = require("../utils/jwt");
const initializeWebSocket = (server) => {
    const io = new socket_io_1.Server(server, {
        cors: {
            origin: process.env.NODE_ENV === "production" ? ["http://localhost:8081"] : "*",
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
        console.log(`✅ User ${userId} connected: ${socket.id}`);
        socket.join(`user:${userId}`);
        socket.on("join_conversation", (conversationId) => {
            const roomName = `conversation_${conversationId}`;
            socket.join(roomName);
            io.to(roomName).emit("user_online", {
                userId,
                conversationId,
                timestamp: new Date().toISOString(),
            });
        });
        socket.on("leave_conversation", (conversationId) => {
            const roomName = `conversation_${conversationId}`;
            socket.leave(roomName);
            io.to(roomName).emit("user_offline", {
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
        socket.on("disconnect", () => {
            console.log(`❌ User ${userId} disconnected: ${socket.id}`);
        });
        socket.on("error", (error) => {
            console.error(`Socket error for user ${userId}:`, error);
        });
    });
    return io;
};
exports.initializeWebSocket = initializeWebSocket;
const emitMessageToConversation = (io, conversationId, message) => {
    const roomName = `conversation_${conversationId}`;
    io.to(roomName).emit("new_message", {
        ...message,
        timestamp: new Date().toISOString(),
    });
};
exports.emitMessageToConversation = emitMessageToConversation;
const emitConversationUpdated = (io, conversationId, memberIds, conversationData) => {
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
exports.emitConversationUpdated = emitConversationUpdated;
