import { Response } from "express";
import { GroupService } from "../services/groupService";
import ResponseUtils from "../utils/response";
import { emitGroupDissolved } from "../websocket";

export class GroupController {
    static async createGroup(req: any, res: Response) {
        try {
            const userId = req.userId;
            const { name, avatar, participantIds } = req.body;

            if (!name || !participantIds || participantIds.length === 0) {
                return ResponseUtils.badRequest(res, "name and participantIds are required");
            }

            const group = await GroupService.createGroup(userId, { name, avatar, participantIds });
            ResponseUtils.success(res, "Group created successfully", group);
        } catch (error: any) {
            ResponseUtils.error(res, error.message);
        }
    }

    static async addMembers(req: any, res: Response) {
        try {
            const userId = req.userId;
            const { id: conversationId } = req.params;
            const { participantIds } = req.body;

            if (!participantIds || participantIds.length === 0) {
                return ResponseUtils.badRequest(res, "participantIds are required");
            }

            const result = await GroupService.addMembers(userId, conversationId, participantIds);
            ResponseUtils.success(res, "Members added successfully", result);
        } catch (error: any) {
            ResponseUtils.error(res, error.message);
        }
    }

    static async removeMember(req: any, res: Response) {
        try {
            const userId = req.userId;
            const { id: conversationId, userId: targetUserId } = req.params;

            const result = await GroupService.removeMember(userId, conversationId, targetUserId);
            ResponseUtils.success(res, "Member removed successfully", result);
        } catch (error: any) {
            ResponseUtils.error(res, error.message);
        }
    }

    static async assignRole(req: any, res: Response) {
        try {
            const userId = req.userId;
            const { id: conversationId } = req.params;
            const { targetUserId, role } = req.body;

            const result = await GroupService.assignRole(userId, conversationId, targetUserId, role);
            ResponseUtils.success(res, "Role assigned successfully", result);
        } catch (error: any) {
            ResponseUtils.error(res, error.message);
        }
    }

    static async leaveGroup(req: any, res: Response) {
        try {
            const userId = req.userId;
            const { id: conversationId } = req.params;
            const { leaveType } = req.body;

            const result = await GroupService.leaveGroup(userId, conversationId, leaveType);
            ResponseUtils.success(res, "Left group successfully", result);
        } catch (error: any) {
            ResponseUtils.error(res, error.message);
        }
    }

    static async updateAvatar(req: any, res: Response) {
        try {
            const userId = req.userId;
            const { id: conversationId } = req.params;
            const { avatarPath } = req.body;

            if (!avatarPath) return ResponseUtils.badRequest(res, "avatarPath is required");

            const result = await GroupService.updateAvatar(userId, conversationId, avatarPath);
            ResponseUtils.success(res, "Avatar updated successfully", result);
        } catch (error: any) {
            ResponseUtils.error(res, error.message);
        }
    }

    static async dissolveGroup(req: any, res: Response) {
        try {
            const userId = req.userId;
            const { id: conversationId } = req.params;

            const result = await GroupService.dissolveGroup(userId, conversationId);
            
            const io = req.app.get("io");
            if (io && result.memberIds) {
                emitGroupDissolved(io, conversationId, result.memberIds);
            }

            ResponseUtils.success(res, "Group dissolved successfully", result);
        } catch (error: any) {
            ResponseUtils.error(res, error.message);
        }
    }
}
