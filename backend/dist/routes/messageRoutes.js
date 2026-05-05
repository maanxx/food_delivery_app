"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const chatController_1 = require("../controllers/chatController");
const auth_1 = require("../middlewares/auth");
const router = (0, express_1.Router)();
// These endpoints are requested specifically in Feature 5
// Note: Due to DynamoDB schema, we might still need conversationId in the body or query
// if it's not part of the path. We'll adapt the controller if needed or assume 
// the existing logic can be shared.
router.delete("/:messageId/delete-for-me", auth_1.authMiddleware, chatController_1.ChatController.deleteMessage);
router.delete("/:messageId/delete-for-everyone", auth_1.authMiddleware, (req, res) => {
    req.body.forEveryone = true;
    return chatController_1.ChatController.deleteMessage(req, res);
});
router.put("/:messageId/recall", auth_1.authMiddleware, chatController_1.ChatController.recallMessage);
exports.default = router;
