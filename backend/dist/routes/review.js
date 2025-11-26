"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ReviewController_1 = require("../controllers/ReviewController");
const auth_1 = require("../middlewares/auth");
const router = (0, express_1.Router)();
// Public routes
router.get("/dishes/:dishId/reviews", ReviewController_1.ReviewController.getReviewsByDish);
router.get("/dishes/:dishId/reviews/stats", ReviewController_1.ReviewController.getReviewStats);
// Protected routes (cần đăng nhập)
router.post("/reviews", auth_1.authMiddleware, ReviewController_1.ReviewController.createReview);
router.get("/reviews/my-reviews", auth_1.authMiddleware, ReviewController_1.ReviewController.getReviewsByUser);
router.put("/reviews/:reviewId", auth_1.authMiddleware, ReviewController_1.ReviewController.updateReview);
router.delete("/reviews/:reviewId", auth_1.authMiddleware, ReviewController_1.ReviewController.deleteReview);
exports.default = router;
