import { Router } from "express";
import { ReviewController } from "../controllers/ReviewController";
import { authMiddleware } from "../middlewares/auth";

const router = Router();

// Public routes
router.get("/dishes/:dishId/reviews", ReviewController.getReviewsByDish);
router.get("/dishes/:dishId/reviews/stats", ReviewController.getReviewStats);

// Protected routes (cần đăng nhập)
router.post("/reviews", authMiddleware, ReviewController.createReview);
router.get("/reviews/my-reviews", authMiddleware, ReviewController.getReviewsByUser);
router.put("/reviews/:reviewId", authMiddleware, ReviewController.updateReview);
router.delete("/reviews/:reviewId", authMiddleware, ReviewController.deleteReview);

export default router;
