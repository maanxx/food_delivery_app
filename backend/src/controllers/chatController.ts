import { Request, Response } from "express";
import { ChatService } from "../services/chatService";
import ResponseUtils from "../utils/response";

export class ChatController {
    static async getConversations(req: any, res: Response) {
        try {
            const userId = req.userId;
            const { limit = 20, cursor } = req.query;

            const result = await ChatService.getUserConversations(userId, parseInt(limit as string), cursor as any);

            ResponseUtils.success(res, "Success", result);
        } catch (error: any) {
            ResponseUtils.error(res, error.message);
        }
    }

    static async getConversationsByUserId(req: any, res: Response) {
        try {
            const { userId } = req.params;
            const { limit = 20, cursor } = req.query;

            if (!userId) {
                return ResponseUtils.badRequest(res, "userId is required");
            }

            const result = await ChatService.getUserConversations(userId, parseInt(limit as string), cursor as any);

            ResponseUtils.success(res, "Success", result);
        } catch (error: any) {
            ResponseUtils.error(res, error.message);
        }
    }

    static async getOrCreateDirectConversation(req: any, res: Response) {
        try {
            const userId = req.userId;
            const { participantId } = req.body;

            if (!participantId) {
                return ResponseUtils.badRequest(res, "participantId is required");
            }

            const conversation = await ChatService.getOrCreateDirectConversation(userId, participantId);

            ResponseUtils.success(res, "Success", conversation);
        } catch (error: any) {
            ResponseUtils.error(res, error.message);
        }
    }

    static async getConversationDetails(req: any, res: Response) {
        try {
            const userId = req.userId;
            const { conversationId } = req.body;

            if (!conversationId) {
                return ResponseUtils.badRequest(res, "conversationId is required");
            }

            const conversation = await ChatService.getConversationDetails(conversationId, userId);

            ResponseUtils.success(res, "Success", conversation);
        } catch (error: any) {
            ResponseUtils.error(res, error.message);
        }
    }

    static async getMessages(req: any, res: Response) {
        try {
            const userId = req.userId;
            const { conversationId, limit = 50, cursor } = req.body;

            if (!conversationId) {
                return ResponseUtils.badRequest(res, "conversationId is required");
            }

            const result = await ChatService.getConversationHistory(conversationId, userId, parseInt(limit as string), cursor as any);

            ResponseUtils.success(res, "Success", result);
        } catch (error: any) {
            ResponseUtils.error(res, error.message);
        }
    }

    static async sendMessage(req: any, res: Response) {
        try {
            const userId = req.userId;
            const { conversationId } = req.params;
            const { content, type = "text", mentions = [], replyToId, attachments = [], metadata = {} } = req.body;
            const io = req.app.get("io");

            const message = await ChatService.sendMessage(userId, conversationId, {
                content: content || "",
                type: type,
                mentions,
                replyToId,
                attachments: attachments,
                metadata: metadata,
            });

            if (io) {
                const { emitMessageToConversation, emitConversationUpdated } = require("../websocket/index");
                const { ConversationParticipantModel } = require("../models/conversationParticipantModel");

                console.log(`[Chat] Emitting new_message to conversation room: ${conversationId}`);
                emitMessageToConversation(io, conversationId, message);

                const members = await ConversationParticipantModel.findMembersOfConversation(conversationId);
                console.log(`[Chat] Broadcasting conversation_updated to ${members.length} members`);

                const lastMessagePayload = {
                    messageId: message.messageId,
                    content: message.content,
                    type: message.type,
                    senderName: message.senderName,
                    senderAvatar: message.senderAvatar,
                    createdAt: message.createdAt,
                    attachments: message.attachments,
                };

                for (const member of members) {
                    const unreadCount = member.user_id !== userId ? (member.unread_count || 0) + 1 : 0;

                    emitConversationUpdated(io, conversationId, [member.user_id], {
                        lastMessage: lastMessagePayload,
                        lastMessageTimestamp: message.createdAt,
                        lastMessageId: message.messageId,
                        unreadCount,
                        // Include the full message for personal-room fallback delivery
                        newMessage: {
                            ...message,
                            conversationId,
                        },
                    });
                }
            } else {
                console.warn("[Chat] io not available - real-time events not sent");
            }

            res.status(201).json({
                success: true,
                data: message,
            });
        } catch (error: any) {
            ResponseUtils.error(res, error.message);
        }
    }

    static async markMessagesAsRead(req: any, res: Response) {
        try {
            const userId = req.userId;
            const { conversationId } = req.params;
            const { messageIds } = req.body;

            if (!messageIds || messageIds.length === 0) {
                return ResponseUtils.badRequest(res, "messageIds array is required");
            }

            const result = await ChatService.markMessagesAsRead(userId, conversationId, messageIds);

            ResponseUtils.success(res, "Success", result);
        } catch (error: any) {
            ResponseUtils.error(res, error.message);
        }
    }

    static async markConversationAsRead(req: any, res: Response) {
        try {
            const userId = req.userId;
            const { conversationId } = req.params;

            const result = await ChatService.markConversationAsRead(userId, conversationId);

            ResponseUtils.success(res, "Success", result);
        } catch (error: any) {
            ResponseUtils.error(res, error.message);
        }
    }
}
