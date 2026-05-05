import { Router } from "express";
import { ChatController } from "../controllers/chatController";
import { authMiddleware } from "../middlewares/auth";

const router = Router();

// These endpoints are requested specifically in Feature 5
// Note: Due to DynamoDB schema, we might still need conversationId in the body or query
// if it's not part of the path. We'll adapt the controller if needed or assume 
// the existing logic can be shared.

router.delete("/:messageId/delete-for-me", authMiddleware, ChatController.deleteMessage);

router.delete("/:messageId/delete-for-everyone", authMiddleware, (req, res) => {
    req.body.forEveryone = true;
    return ChatController.deleteMessage(req, res);
});

router.put("/:messageId/recall", authMiddleware, ChatController.recallMessage);

export default router;
