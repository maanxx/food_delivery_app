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
                result[camelKey] = toCamelCase(obj[key]);
                return result;
            }, {} as any);
        }
    }
    return obj;
};

export class ChatService {
    static async getOrCreateDirectConversation(userId: string, participantId: string) {
        try {
            if (userId === participantId) {
                throw new Error("Cannot create a conversation with yourself");
            }

            const existingConversation = await ConversationModel.findDirectConversation(userId, participantId);
            if (existingConversation) {
                const isMember = await ConversationParticipantModel.isMember(existingConversation.conversation_id, userId);
                if (!isMember) {
                    await ConversationParticipantModel.addParticipant(existingConversation.conversation_id, userId, "member");
                }
                
                const otherMemberIsMember = await ConversationParticipantModel.isMember(existingConversation.conversation_id, participantId);
                if (!otherMemberIsMember) {
                    await ConversationParticipantModel.addParticipant(existingConversation.conversation_id, participantId, "member");
                }

                await ConversationParticipantModel.restoreConversation(existingConversation.conversation_id, userId);

                const otherUser = await UserModel.findById(participantId);
                return toCamelCase({
                    ...existingConversation,
                    name: otherUser?.fullname || otherUser?.username || "Unknown",
                    avatarPath: otherUser?.avatar || otherUser?.avatar_path || null,
                });
            }

            const newConversation = await ConversationModel.create({
                type: "1to1",
                creator_id: userId,
            });

            await ConversationParticipantModel.addParticipant(newConversation.conversation_id, userId, "admin");
            await ConversationParticipantModel.addParticipant(newConversation.conversation_id, participantId, "member");

            const otherUser = await UserModel.findById(participantId);
            return toCamelCase({
                ...newConversation,
                name: otherUser?.fullname || otherUser?.username || "Unknown",
                avatarPath: otherUser?.avatar || otherUser?.avatar_path || null,
            });
        } catch (error) {
            throw error;
        }
    }

    static async getUserConversations(userId: string, limit = 20, cursor = null) {
        try {
            const result = await ConversationParticipantModel.findByUserId(userId, limit, cursor);
            const conversations = [];

            if (result.items) {
                for (const participant of result.items) {
                    const conversation = await ConversationModel.findById(participant.conversation_id);
                    if (!conversation || conversation.is_active === false) continue;

                    const convData: any = {
                        ...conversation,
                        unreadCount: participant.unread_count || 0,
                        role: participant.role,
                        joinedAt: participant.joined_at,
                    };

                    if (conversation.last_message_id) {
                        const lastMessage = await MessageModel.findById(participant.conversation_id, conversation.last_message_id);
                        if (lastMessage) {
                            const sender = await UserModel.findById(lastMessage.sender_id);
                            
                            // Check if last message was deleted/recalled
                            let content = lastMessage.content;
                            if (lastMessage.is_recalled) {
                                content = "This message was recalled";
                            } else if (lastMessage.is_deleted) {
                                content = "This message was deleted";
                            }

                            convData.lastMessage = {
                                messageId: lastMessage.message_id,
                                content: content,
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

    static async deleteMessageForMe(userId: string, conversationId: string, messageId: string) {
        try {
            const message = await MessageModel.findById(conversationId, messageId);
            if (!message) throw new Error("Message not found");

            await MessageModel.deleteMessageForUser(conversationId, messageId, userId);
            return { success: true };
        } catch (error) {
            throw error;
        }
    }

    static async deleteMessageForEveryone(userId: string, conversationId: string, messageId: string) {
        try {
            const message = await MessageModel.findById(conversationId, messageId);
            if (!message) throw new Error("Message not found");

            if (message.sender_id !== userId) {
                throw new Error("Only the sender can delete a message for everyone");
            }

            await MessageModel.delete(conversationId, messageId);
            return { success: true };
        } catch (error) {
            throw error;
        }
    }

    static async recallMessage(userId: string, conversationId: string, messageId: string) {
        try {
            const message = await MessageModel.findById(conversationId, messageId);
            if (!message) throw new Error("Message not found");

            if (message.sender_id !== userId) {
                throw new Error("Only the sender can recall a message");
            }

            // Check time limit (5 minutes)
            const createdAt = new Date(message.created_at).getTime();
            const now = new Date().getTime();
            const diffMinutes = (now - createdAt) / (1000 * 60);

            if (diffMinutes > 5) {
                throw new Error("Messages can only be recalled within 5 minutes");
            }

            await MessageModel.recall(conversationId, messageId);
            return { success: true };
        } catch (error) {
            throw error;
        }
    }
}
