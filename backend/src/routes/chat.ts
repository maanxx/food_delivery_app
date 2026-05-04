import { Router } from "express";
import { ChatController } from "../controllers/chatController";
import { authMiddleware } from "../middlewares/auth";

const router = Router();

// Get user's conversations
router.get("/", authMiddleware, ChatController.getConversations);

// Get conversations by userId
router.get("/user/:userId", authMiddleware, ChatController.getConversationsByUserId);

// Create 1-to-1 conversation
router.post("/", authMiddleware, ChatController.getOrCreateDirectConversation);

// Get conversation details
router.post("/details", authMiddleware, ChatController.getConversationDetails);

// Get messages in conversation
router.post("/messages", authMiddleware, ChatController.getMessages);

// Send message
router.post("/:conversationId/messages", authMiddleware, ChatController.sendMessage);

// Mark messages as read
router.put("/:conversationId/messages/read", authMiddleware, ChatController.markMessagesAsRead);

// Mark conversation as read
router.put("/:conversationId/read", authMiddleware, ChatController.markConversationAsRead);

// Delete message
router.delete("/:conversationId/messages/:messageId", authMiddleware, ChatController.deleteMessage);

// Recall message
router.post("/:conversationId/messages/:messageId/recall", authMiddleware, ChatController.recallMessage);

export default router;
