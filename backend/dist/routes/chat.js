"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const chatController_1 = require("../controllers/chatController");
const auth_1 = require("../middlewares/auth");
const router = (0, express_1.Router)();
// Get user's conversations
router.get("/", auth_1.authMiddleware, chatController_1.ChatController.getConversations);
// Get conversations by userId
router.get("/user/:userId", auth_1.authMiddleware, chatController_1.ChatController.getConversationsByUserId);
// Create 1-to-1 conversation
router.post("/", auth_1.authMiddleware, chatController_1.ChatController.getOrCreateDirectConversation);
// Get conversation details
router.post("/details", auth_1.authMiddleware, chatController_1.ChatController.getConversationDetails);
// Get messages in conversation
router.post("/messages", auth_1.authMiddleware, chatController_1.ChatController.getMessages);
// Send message
router.post("/:conversationId/messages", auth_1.authMiddleware, chatController_1.ChatController.sendMessage);
// Mark messages as read
router.put("/:conversationId/messages/read", auth_1.authMiddleware, chatController_1.ChatController.markMessagesAsRead);
// Mark conversation as read
router.put("/:conversationId/read", auth_1.authMiddleware, chatController_1.ChatController.markConversationAsRead);
// Delete message
router.delete("/:conversationId/messages/:messageId", auth_1.authMiddleware, chatController_1.ChatController.deleteMessage);
// Recall message
router.post("/:conversationId/messages/:messageId/recall", auth_1.authMiddleware, chatController_1.ChatController.recallMessage);
exports.default = router;
