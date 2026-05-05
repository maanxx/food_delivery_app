import { Router } from "express";
import { GroupController } from "../controllers/groupController";
import { authMiddleware } from "../middlewares/auth";

const router = Router();

// Create group
router.post("/create", authMiddleware, GroupController.createGroup);

// Add members
router.post("/:id/add-member", authMiddleware, GroupController.addMembers);

// Remove member
router.delete("/:id/remove-member/:userId", authMiddleware, GroupController.removeMember);

// Assign role
router.put("/:id/assign-role", authMiddleware, GroupController.assignRole);

// Update avatar
router.put("/:id/avatar", authMiddleware, GroupController.updateAvatar);

// Leave group
router.delete("/:id/leave", authMiddleware, GroupController.leaveGroup);

// Dissolve group
router.delete("/:id/dissolve", authMiddleware, GroupController.dissolveGroup);

export default router;
