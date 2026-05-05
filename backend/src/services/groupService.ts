import { ConversationModel } from "../models/conversationModel";
import { ConversationParticipantModel } from "../models/conversationParticipantModel";
import { UserModel } from "../models/User";

export class GroupService {
    static async createGroup(userId: string, data: { name: string; avatar?: string; participantIds: string[] }) {
        const { name, avatar, participantIds } = data;

        // 1. Create the conversation
        const conversation = await ConversationModel.create({
            type: "group",
            name,
            avatar_path: avatar || null,
            creator_id: userId,
        });

        // 2. Add the creator as owner
        await ConversationParticipantModel.addParticipant(conversation.conversation_id, userId, "owner");

        // 3. Add other participants as members
        for (const pId of participantIds) {
            if (pId !== userId) {
                await ConversationParticipantModel.addParticipant(conversation.conversation_id, pId, "member");
            }
        }

        return conversation;
    }

    static async addMembers(userId: string, conversationId: string, participantIds: string[]) {
        // Check if requester is admin/owner
        const participant = await ConversationParticipantModel.isMember(conversationId, userId);
        if (!participant) throw new Error("Not a member of this group");

        const memberInfo: any = await ConversationParticipantModel.findByUserIdAndConvId(userId, conversationId);
        if (memberInfo.role !== "admin" && memberInfo.role !== "owner") {
            throw new Error("Only admins or owners can add members");
        }

        for (const pId of participantIds) {
            const isAlreadyMember = await ConversationParticipantModel.isMember(conversationId, pId);
            if (!isAlreadyMember) {
                await ConversationParticipantModel.addParticipant(conversationId, pId, "member");
            }
        }

        return { success: true };
    }

    static async removeMember(userId: string, conversationId: string, targetUserId: string) {
        const requester: any = await ConversationParticipantModel.findByUserIdAndConvId(userId, conversationId);
        if (!requester) throw new Error("Not a member of this group");

        if (requester.role !== "admin" && requester.role !== "owner") {
            throw new Error("Only admins or owners can remove members");
        }

        const target: any = await ConversationParticipantModel.findByUserIdAndConvId(targetUserId, conversationId);
        if (!target) throw new Error("Target user is not a member of this group");

        if (target.role === "owner") throw new Error("Cannot remove the owner");
        if (target.role === "admin" && requester.role !== "owner") {
            throw new Error("Only owners can remove admins");
        }

        await ConversationParticipantModel.remove(conversationId, targetUserId);
        return { success: true };
    }

    static async assignRole(userId: string, conversationId: string, targetUserId: string, role: string) {
        const requester: any = await ConversationParticipantModel.findByUserIdAndConvId(userId, conversationId);
        if (!requester || requester.role !== "owner") {
            throw new Error("Only owners can assign roles");
        }

        if (!["admin", "member"].includes(role)) {
            throw new Error("Invalid role");
        }

        await ConversationParticipantModel.updateRole(conversationId, targetUserId, role);
        return { success: true };
    }

    static async leaveGroup(userId: string, conversationId: string) {
        const participant: any = await ConversationParticipantModel.findByUserIdAndConvId(userId, conversationId);
        if (!participant) throw new Error("Not a member of this group");

        if (participant.role === "owner") {
            throw new Error("Owners cannot leave. Dissolve the group instead or transfer ownership.");
        }

        await ConversationParticipantModel.remove(conversationId, userId);
        return { success: true };
    }

    static async dissolveGroup(userId: string, conversationId: string) {
        const participant: any = await ConversationParticipantModel.findByUserIdAndConvId(userId, conversationId);
        if (!participant || participant.role !== "owner") {
            throw new Error("Only owners can dissolve the group");
        }

        await ConversationModel.delete(conversationId);
        // Optional: mark all participants as inactive
        const members = await ConversationParticipantModel.findMembersOfConversation(conversationId);
        for (const member of members) {
            await ConversationParticipantModel.markAsInactive(conversationId, member.user_id);
        }

        return { success: true };
    }
}
