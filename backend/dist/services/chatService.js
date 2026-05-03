"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatService = void 0;
const conversationModel_1 = require("../models/conversationModel");
const conversationParticipantModel_1 = require("../models/conversationParticipantModel");
const messageModel_1 = require("../models/messageModel");
const User_1 = require("../models/User");
const toCamelCase = (obj) => {
    if (Array.isArray(obj)) {
        return obj.map((v) => toCamelCase(v));
    }
    else if (obj !== null && obj.constructor === Object) {
        return Object.keys(obj).reduce((result, key) => {
            const camelKey = key.replace(/([-_][a-z])/ig, ($1) => {
                return $1.toUpperCase().replace('-', '').replace('_', '');
            });
            result[camelKey] = toCamelCase(obj[key]);
            return result;
        }, {});
    }
    return obj;
};
class ChatService {
    static async getOrCreateDirectConversation(userId, participantId) {
        try {
            const userConversations = await conversationParticipantModel_1.ConversationParticipantModel.findConversationsForUser(userId);
            const items = userConversations.items || [];
            for (const conv of items) {
                const convData = await conversationModel_1.ConversationModel.findById(conv.conversation_id);
                if (!convData || convData.is_active === false)
                    continue;
                if (convData.type === "1to1") {
                    const members = await conversationParticipantModel_1.ConversationParticipantModel.findMembersOfConversation(conv.conversation_id) || [];
                    if (members.length === 2 && members.some((m) => m.user_id === participantId)) {
                        return toCamelCase(convData);
                    }
                }
            }
            const participantData = await User_1.UserModel.findById(participantId);
            if (!participantData) {
                throw new Error("Participant not found");
            }
            const newConversation = await conversationModel_1.ConversationModel.create({
                type: "1to1",
                name: participantData.fullname || participantData.username || participantData.email,
                avatar_path: participantData.avatar || participantData.avatar_path,
                created_by: userId,
            });
            await conversationParticipantModel_1.ConversationParticipantModel.create({
                conversation_id: newConversation.conversation_id,
                user_id: userId,
                role: "member",
            });
            await conversationParticipantModel_1.ConversationParticipantModel.create({
                conversation_id: newConversation.conversation_id,
                user_id: participantId,
                role: "member",
            });
            return toCamelCase(newConversation);
        }
        catch (error) {
            throw error;
        }
    }
    static async createGroupConversation(userId, name, participantIds, avatarPath = null) {
        try {
            if (!participantIds.includes(userId)) {
                participantIds.push(userId);
            }
            const newConversation = await conversationModel_1.ConversationModel.create({
                type: "group",
                name,
                avatar_path: avatarPath,
                created_by: userId,
                description: null,
            });
            for (const participantId of participantIds) {
                const role = participantId === userId ? "admin" : "member";
                await conversationParticipantModel_1.ConversationParticipantModel.create({
                    conversation_id: newConversation.conversation_id,
                    user_id: participantId,
                    role,
                });
            }
            await messageModel_1.MessageModel.create({
                conversation_id: newConversation.conversation_id,
                sender_id: userId,
                content: `Created group "${name}"`,
                type: "system",
            });
            return toCamelCase(newConversation);
        }
        catch (error) {
            throw error;
        }
    }
    static async getUserConversations(userId, limit = 20, cursor = null) {
        try {
            const result = await conversationParticipantModel_1.ConversationParticipantModel.findConversationsForUser(userId, limit, cursor);
            const items = result.items || [];
            const conversations = [];
            for (const participant of items) {
                const conversation = await conversationModel_1.ConversationModel.findById(participant.conversation_id);
                if (conversation && conversation.is_active !== false && !participant.deleted_at) {
                    let convData = {
                        ...conversation,
                        unreadCount: participant.unread_count,
                        isMuted: participant.is_muted,
                        isPinned: participant.is_pinned,
                        lastReadAt: participant.last_read_at,
                    };
                    if (conversation.last_message_id) {
                        const lastMessage = await messageModel_1.MessageModel.findById(participant.conversation_id, conversation.last_message_id);
                        if (lastMessage) {
                            const sender = await User_1.UserModel.findById(lastMessage.sender_id);
                            convData.lastMessage = {
                                messageId: lastMessage.message_id,
                                content: lastMessage.content,
                                type: lastMessage.type,
                                senderName: sender?.fullname || sender?.username || "Unknown User",
                                senderAvatar: sender?.avatar || sender?.avatar_path || null,
                                createdAt: lastMessage.created_at,
                            };
                        }
                    }
                    if (conversation.type === "1to1") {
                        const members = await conversationParticipantModel_1.ConversationParticipantModel.findMembersOfConversation(participant.conversation_id) || [];
                        const otherMember = members.find((m) => m.user_id !== userId);
                        if (otherMember) {
                            const otherUser = await User_1.UserModel.findById(otherMember.user_id);
                            convData.name = otherUser?.fullname || otherUser?.username || "Unknown";
                            convData.avatar_path = otherUser?.avatar || otherUser?.avatar_path || null;
                        }
                    }
                    conversations.push(toCamelCase(convData));
                }
            }
            conversations.sort((a, b) => {
                const aTime = new Date(a.lastMessageTimestamp || a.createdAt || 0).getTime();
                const bTime = new Date(b.lastMessageTimestamp || b.createdAt || 0).getTime();
                return bTime - aTime;
            });
            return {
                conversations,
                hasMore: !!result.lastEvaluatedKey,
                nextCursor: result.lastEvaluatedKey,
            };
        }
        catch (error) {
            throw error;
        }
    }
    static async getConversationDetails(conversationId, userId) {
        try {
            const conversation = await conversationModel_1.ConversationModel.findById(conversationId);
            if (!conversation || conversation.is_active === false) {
                throw new Error("Conversation not found");
            }
            const isMember = await conversationParticipantModel_1.ConversationParticipantModel.isMember(conversationId, userId);
            if (!isMember) {
                throw new Error("Not a member of this conversation");
            }
            const members = await conversationParticipantModel_1.ConversationParticipantModel.findMembersOfConversation(conversationId) || [];
            const participantDetails = [];
            for (const member of members) {
                const user = await User_1.UserModel.findById(member.user_id);
                participantDetails.push({
                    userId: member.user_id,
                    username: user?.username || "Unknown",
                    email: user?.email || null,
                    fullname: user?.fullname || "Unknown User",
                    avatarPath: user?.avatar || user?.avatar_path || null,
                    role: member.role,
                    joinedAt: member.joined_at,
                });
            }
            return toCamelCase({
                ...conversation,
                participants: participantDetails,
            });
        }
        catch (error) {
            throw error;
        }
    }
    static async sendMessage(userId, conversationId, messageData) {
        try {
            const conversation = await conversationModel_1.ConversationModel.findById(conversationId);
            if (!conversation || conversation.is_active === false) {
                throw new Error("Conversation not found");
            }
            const isMember = await conversationParticipantModel_1.ConversationParticipantModel.isMember(conversationId, userId);
            if (!isMember) {
                throw new Error("Not a member of this conversation");
            }
            const deletedAt = await conversationParticipantModel_1.ConversationParticipantModel.getDeletedAt(conversationId, userId);
            if (deletedAt) {
                await conversationParticipantModel_1.ConversationParticipantModel.restoreConversation(conversationId, userId);
            }
            const message = await messageModel_1.MessageModel.create({
                conversation_id: conversationId,
                sender_id: userId,
                content: messageData.content,
                type: messageData.type || "text",
                mentions: messageData.mentions || [],
                attachments: messageData.attachments || [],
                reply_to_id: messageData.replyToId || null,
            });
            await conversationModel_1.ConversationModel.updateLastMessage(conversationId, message.message_id, new Date().toISOString());
            const members = await conversationParticipantModel_1.ConversationParticipantModel.findMembersOfConversation(conversationId) || [];
            for (const member of members) {
                if (member.user_id !== userId) {
                    await conversationParticipantModel_1.ConversationParticipantModel.updateUnreadCount(conversationId, member.user_id, 1);
                }
            }
            const sender = await User_1.UserModel.findById(userId);
            return toCamelCase({
                ...message,
                senderName: sender?.fullname || sender?.username || "Unknown User",
                senderAvatar: sender?.avatar || sender?.avatar_path || null,
            });
        }
        catch (error) {
            throw error;
        }
    }
    static async getConversationHistory(conversationId, userId, limit = 50, cursor = null) {
        try {
            const conversation = await conversationModel_1.ConversationModel.findById(conversationId);
            if (!conversation || conversation.is_active === false) {
                throw new Error("Conversation not found");
            }
            const isMember = await conversationParticipantModel_1.ConversationParticipantModel.isMember(conversationId, userId);
            if (!isMember) {
                throw new Error("Not a member of this conversation");
            }
            const deletedAt = await conversationParticipantModel_1.ConversationParticipantModel.getDeletedAt(conversationId, userId);
            const result = await messageModel_1.MessageModel.getHistory(conversationId, limit, cursor, userId, deletedAt);
            const messages = [];
            for (const msg of result.messages) {
                const sender = await User_1.UserModel.findById(msg.sender_id);
                messages.push(toCamelCase({
                    ...msg,
                    senderName: sender?.fullname || sender?.username || "Unknown User",
                    senderAvatar: sender?.avatar || sender?.avatar_path || null,
                }));
            }
            return {
                messages,
                hasMore: !!result.lastKey,
                nextCursor: result.lastKey,
            };
        }
        catch (error) {
            throw error;
        }
    }
    static async markMessagesAsRead(userId, conversationId, messageIds) {
        try {
            const conversation = await conversationModel_1.ConversationModel.findById(conversationId);
            if (!conversation || conversation.is_active === false) {
                throw new Error("Conversation not found");
            }
            for (const messageId of messageIds) {
                await messageModel_1.MessageModel.updateStatus(conversationId, messageId, true);
            }
            await conversationParticipantModel_1.ConversationParticipantModel.markAsRead(conversationId, userId);
            return { success: true, readCount: messageIds.length };
        }
        catch (error) {
            throw error;
        }
    }
    static async markConversationAsRead(userId, conversationId) {
        try {
            const conversation = await conversationModel_1.ConversationModel.findById(conversationId);
            if (!conversation || conversation.is_active === false) {
                throw new Error("Conversation not found");
            }
            await conversationParticipantModel_1.ConversationParticipantModel.markAsRead(conversationId, userId);
            return { success: true };
        }
        catch (error) {
            throw error;
        }
    }
}
exports.ChatService = ChatService;
