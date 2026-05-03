import { ConversationModel } from "../models/conversationModel";
import { ConversationParticipantModel } from "../models/conversationParticipantModel";
import { MessageModel } from "../models/messageModel";
import { UserModel } from "../models/User";

const toCamelCase = (obj: any): any => {
    if (obj === null || obj === undefined) return obj;
    if (Array.isArray(obj)) {
        return obj.map((v) => toCamelCase(v));
    } else if (typeof obj === 'object') {
        // Safe check for constructor to avoid "Cannot read properties of undefined (reading 'constructor')"
        const isPlainObject = obj.constructor ? obj.constructor === Object : Object.getPrototypeOf(obj) === null;
        
        if (isPlainObject || !obj.constructor) {
            return Object.keys(obj).reduce((result, key) => {
                const camelKey = key.replace(/([-_][a-z])/ig, ($1) => {
                    return $1.toUpperCase().replace('-', '').replace('_', '');
                });
                result[camelKey as keyof typeof result] = toCamelCase(obj[key]);
                return result;
            }, {} as any);
        }
    }
    return obj;
};

export class ChatService {
    static async getOrCreateDirectConversation(userId: string, participantId: string) {
        try {
            const userConversations = await ConversationParticipantModel.findConversationsForUser(userId);
            const items = userConversations.items || [];

            for (const conv of items) {
                const convData = await ConversationModel.findById(conv.conversation_id);
                if (!convData || convData.is_active === false) continue;

                if (convData.type === "1to1") {
                    const members = await ConversationParticipantModel.findMembersOfConversation(conv.conversation_id) || [];
                    if (members.length === 2 && members.some((m: any) => m.user_id === participantId)) {
                        return toCamelCase(convData);
                    }
                }
            }

            const participantData = await UserModel.findById(participantId);
            if (!participantData) {
                throw new Error("Participant not found");
            }

            const newConversation = await ConversationModel.create({
                type: "1to1",
                name: participantData.fullname || participantData.username || participantData.email,
                avatar_path: participantData.avatar || participantData.avatar_path,
                created_by: userId,
            });

            await ConversationParticipantModel.create({
                conversation_id: newConversation.conversation_id,
                user_id: userId,
                role: "member",
            });

            await ConversationParticipantModel.create({
                conversation_id: newConversation.conversation_id,
                user_id: participantId,
                role: "member",
            });

            return toCamelCase(newConversation);
        } catch (error) {
            throw error;
        }
    }

    static async createGroupConversation(userId: string, name: string, participantIds: string[], avatarPath = null) {
        try {
            if (!participantIds.includes(userId)) {
                participantIds.push(userId);
            }

            const newConversation = await ConversationModel.create({
                type: "group",
                name,
                avatar_path: avatarPath,
                created_by: userId,
                description: null,
            });

            for (const participantId of participantIds) {
                const role = participantId === userId ? "admin" : "member";
                await ConversationParticipantModel.create({
                    conversation_id: newConversation.conversation_id,
                    user_id: participantId,
                    role,
                });
            }

            await MessageModel.create({
                conversation_id: newConversation.conversation_id,
                sender_id: userId,
                content: `Created group "${name}"`,
                type: "system",
            });

            return toCamelCase(newConversation);
        } catch (error) {
            throw error;
        }
    }

    static async getUserConversations(userId: string, limit = 20, cursor = null) {
        try {
            const result = await ConversationParticipantModel.findConversationsForUser(userId, limit, cursor);
            const items = result.items || [];

            const conversations = [];
            for (const participant of items) {
                const conversation = await ConversationModel.findById(participant.conversation_id);
                if (conversation && conversation.is_active !== false && !participant.deleted_at) {
                    let convData: any = {
                        ...conversation,
                        unreadCount: participant.unread_count,
                        isMuted: participant.is_muted,
                        isPinned: participant.is_pinned,
                        lastReadAt: participant.last_read_at,
                    };

                    if (conversation.last_message_id) {
                        const lastMessage = await MessageModel.findById(participant.conversation_id, conversation.last_message_id);
                        if (lastMessage) {
                            const sender = await UserModel.findById(lastMessage.sender_id);
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
                        const members = await ConversationParticipantModel.findMembersOfConversation(participant.conversation_id) || [];
                        const otherMember = members.find((m: any) => m.user_id !== userId);
                        if (otherMember) {
                            const otherUser = await UserModel.findById(otherMember.user_id);
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
        } catch (error) {
            throw error;
        }
    }

    static async getConversationDetails(conversationId: string, userId: string) {
        try {
            const conversation = await ConversationModel.findById(conversationId);
            if (!conversation || conversation.is_active === false) {
                throw new Error("Conversation not found");
            }

            const isMember = await ConversationParticipantModel.isMember(conversationId, userId);
            if (!isMember) {
                throw new Error("Not a member of this conversation");
            }

            const members = await ConversationParticipantModel.findMembersOfConversation(conversationId) || [];
            const participantDetails = [];
            for (const member of members) {
                const user = await UserModel.findById(member.user_id);
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
        } catch (error) {
            throw error;
        }
    }

    static async sendMessage(userId: string, conversationId: string, messageData: any) {
        try {
            const conversation = await ConversationModel.findById(conversationId);
            if (!conversation || conversation.is_active === false) {
                throw new Error("Conversation not found");
            }

            const isMember = await ConversationParticipantModel.isMember(conversationId, userId);
            if (!isMember) {
                throw new Error("Not a member of this conversation");
            }

            const deletedAt = await ConversationParticipantModel.getDeletedAt(conversationId, userId);
            if (deletedAt) {
                await ConversationParticipantModel.restoreConversation(conversationId, userId);
            }

            const message = await MessageModel.create({
                conversation_id: conversationId,
                sender_id: userId,
                content: messageData.content,
                type: messageData.type || "text",
                mentions: messageData.mentions || [],
                attachments: messageData.attachments || [],
                reply_to_id: messageData.replyToId || null,
                metadata: messageData.metadata || null,
            });

            await ConversationModel.updateLastMessage(conversationId, message.message_id, new Date().toISOString());

            const members = await ConversationParticipantModel.findMembersOfConversation(conversationId) || [];
            for (const member of members) {
                if (member.user_id !== userId) {
                    await ConversationParticipantModel.updateUnreadCount(conversationId, member.user_id, 1);
                }
            }

            const sender = await UserModel.findById(userId);
            return toCamelCase({
                ...message,
                senderName: sender?.fullname || sender?.username || "Unknown User",
                senderAvatar: sender?.avatar || sender?.avatar_path || null,
            });
        } catch (error) {
            throw error;
        }
    }

    static async getConversationHistory(conversationId: string, userId: string, limit = 50, cursor = null) {
        try {
            const conversation = await ConversationModel.findById(conversationId);
            if (!conversation || conversation.is_active === false) {
                throw new Error("Conversation not found");
            }

            const isMember = await ConversationParticipantModel.isMember(conversationId, userId);
            if (!isMember) {
                throw new Error("Not a member of this conversation");
            }

            const deletedAt = await ConversationParticipantModel.getDeletedAt(conversationId, userId);
            const result = await MessageModel.getHistory(conversationId, limit, cursor, userId, deletedAt);

            const messages = [];
            for (const msg of result.messages) {
                const sender = await UserModel.findById(msg.sender_id);
                messages.push(
                    toCamelCase({
                        ...msg,
                        senderName: sender?.fullname || sender?.username || "Unknown User",
                        senderAvatar: sender?.avatar || sender?.avatar_path || null,
                    })
                );
            }

            return {
                messages,
                hasMore: !!result.lastKey,
                nextCursor: result.lastKey,
            };
        } catch (error) {
            throw error;
        }
    }

    static async markMessagesAsRead(userId: string, conversationId: string, messageIds: string[]) {
        try {
            const conversation = await ConversationModel.findById(conversationId);
            if (!conversation || conversation.is_active === false) {
                throw new Error("Conversation not found");
            }

            for (const messageId of messageIds) {
                await MessageModel.updateStatus(conversationId, messageId, true);
            }

            await ConversationParticipantModel.markAsRead(conversationId, userId);
            return { success: true, readCount: messageIds.length };
        } catch (error) {
            throw error;
        }
    }

    static async markConversationAsRead(userId: string, conversationId: string) {
        try {
            const conversation = await ConversationModel.findById(conversationId);
            if (!conversation || conversation.is_active === false) {
                throw new Error("Conversation not found");
            }

            await ConversationParticipantModel.markAsRead(conversationId, userId);
            return { success: true };
        } catch (error) {
            throw error;
        }
    }
}
