"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatController = void 0;
const chatService_1 = require("../services/chatService");
const response_1 = __importDefault(require("../utils/response"));
class ChatController {
    static async getConversations(req, res) {
        try {
            const userId = req.userId;
            const { limit = 20, cursor } = req.query;
            const result = await chatService_1.ChatService.getUserConversations(userId, parseInt(limit), cursor);
            response_1.default.success(res, "Success", result);
        }
        catch (error) {
            response_1.default.error(res, error.message);
        }
    }
    static async getConversationsByUserId(req, res) {
        try {
            const { userId } = req.params;
            const { limit = 20, cursor } = req.query;
            if (!userId) {
                return response_1.default.badRequest(res, "userId is required");
            }
            const result = await chatService_1.ChatService.getUserConversations(userId, parseInt(limit), cursor);
            response_1.default.success(res, "Success", result);
        }
        catch (error) {
            response_1.default.error(res, error.message);
        }
    }
    static async getOrCreateDirectConversation(req, res) {
        try {
            const userId = req.userId;
            const { participantId } = req.body;
            if (!participantId) {
                return response_1.default.badRequest(res, "participantId is required");
            }
            const conversation = await chatService_1.ChatService.getOrCreateDirectConversation(userId, participantId);
            response_1.default.success(res, "Success", conversation);
        }
        catch (error) {
            response_1.default.error(res, error.message);
        }
    }
    static async getConversationDetails(req, res) {
        try {
            const userId = req.userId;
            const { conversationId } = req.body;
            if (!conversationId) {
                return response_1.default.badRequest(res, "conversationId is required");
            }
            const conversation = await chatService_1.ChatService.getConversationDetails(conversationId, userId);
            response_1.default.success(res, "Success", conversation);
        }
        catch (error) {
            response_1.default.error(res, error.message);
        }
    }
    static async getMessages(req, res) {
        try {
            const userId = req.userId;
            const { conversationId, limit = 50, cursor } = req.body;
            if (!conversationId) {
                return response_1.default.badRequest(res, "conversationId is required");
            }
            const result = await chatService_1.ChatService.getConversationHistory(conversationId, userId, parseInt(limit), cursor);
            response_1.default.success(res, "Success", result);
        }
        catch (error) {
            response_1.default.error(res, error.message);
        }
    }
    static async sendMessage(req, res) {
        try {
            const userId = req.userId;
            const { conversationId } = req.params;
            const { content, type = "text", mentions = [], replyToId } = req.body;
            const io = req.app.get("io");
            if (!content) {
                return response_1.default.badRequest(res, "content is required");
            }
            const message = await chatService_1.ChatService.sendMessage(userId, conversationId, {
                content: content,
                type: type,
                mentions,
                replyToId,
                attachments: [],
            });
            if (io) {
                const { emitMessageToConversation, emitConversationUpdated } = require("../websocket/index");
                const { ConversationParticipantModel } = require("../models/conversationParticipantModel");
                emitMessageToConversation(io, conversationId, message);
                const members = await ConversationParticipantModel.findMembersOfConversation(conversationId);
                for (const member of members) {
                    const unreadCount = member.user_id !== userId ? (member.unread_count || 0) + 1 : 0;
                    emitConversationUpdated(io, conversationId, [member.user_id], {
                        lastMessage: {
                            messageId: message.messageId,
                            content: message.content,
                            type: message.type,
                            senderName: message.senderName,
                            senderAvatar: message.senderAvatar,
                            createdAt: message.createdAt,
                            attachments: message.attachments,
                        },
                        lastMessageTimestamp: message.createdAt,
                        lastMessageId: message.messageId,
                        unreadCount,
                    });
                }
            }
            res.status(201).json({
                success: true,
                data: message,
            });
        }
        catch (error) {
            response_1.default.error(res, error.message);
        }
    }
    static async markMessagesAsRead(req, res) {
        try {
            const userId = req.userId;
            const { conversationId } = req.params;
            const { messageIds } = req.body;
            if (!messageIds || messageIds.length === 0) {
                return response_1.default.badRequest(res, "messageIds array is required");
            }
            const result = await chatService_1.ChatService.markMessagesAsRead(userId, conversationId, messageIds);
            response_1.default.success(res, "Success", result);
        }
        catch (error) {
            response_1.default.error(res, error.message);
        }
    }
    static async markConversationAsRead(req, res) {
        try {
            const userId = req.userId;
            const { conversationId } = req.params;
            const result = await chatService_1.ChatService.markConversationAsRead(userId, conversationId);
            response_1.default.success(res, "Success", result);
        }
        catch (error) {
            response_1.default.error(res, error.message);
        }
    }
}
exports.ChatController = ChatController;
