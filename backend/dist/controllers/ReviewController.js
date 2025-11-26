"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReviewController = void 0;
const response_1 = __importDefault(require("../utils/response"));
const Review_1 = require("../models/Review");
const Dish_1 = require("../models/Dish");
const User_1 = require("../models/User");
class ReviewController {
    // Tạo review mới
    static async createReview(req, res) {
        try {
            const { dish_id, points, content } = req.body;
            const user_id = req.user?.user_id;
            if (!user_id) {
                return response_1.default.error(res, "Unauthorized", 401);
            }
            // Validate
            if (!dish_id || !points || !content) {
                return response_1.default.error(res, "Thiếu thông tin bắt buộc (dish_id, points, content)", 400);
            }
            if (points < 0 || points > 5) {
                return response_1.default.error(res, "Điểm đánh giá phải từ 0 đến 5", 400);
            }
            // Kiểm tra món ăn tồn tại
            const dish = await Dish_1.DishModel.findById(dish_id);
            if (!dish) {
                return response_1.default.error(res, "Không tìm thấy món ăn", 404);
            }
            // Tạo review
            const reviewId = await Review_1.ReviewModel.create({
                user_id,
                dish_id,
                points: Number(points),
                content: String(content).trim(),
            });
            // Cập nhật điểm trung bình và số lượng đánh giá của món ăn
            await Review_1.ReviewModel.updateDishRating(dish_id);
            return response_1.default.success(res, "Tạo đánh giá thành công", { review_id: reviewId }, 201);
        }
        catch (error) {
            console.error("Create review error:", error);
            return response_1.default.error(res, "Lỗi server", 500);
        }
    }
    // Lấy tất cả reviews của một món ăn
    static async getReviewsByDish(req, res) {
        try {
            const { dishId } = req.params;
            const { page = 1, limit = 10, sort = "desc" } = req.query;
            // Kiểm tra món ăn tồn tại
            const dish = await Dish_1.DishModel.findById(dishId);
            if (!dish) {
                return response_1.default.error(res, "Không tìm thấy món ăn", 404);
            }
            const pageNum = Math.max(1, parseInt(String(page), 10) || 1);
            const limitNum = Math.max(1, parseInt(String(limit), 10) || 10);
            const offset = (pageNum - 1) * limitNum;
            const reviews = await Review_1.ReviewModel.findByDish(dishId, limitNum, offset, String(sort));
            // Lấy thông tin user cho mỗi review
            const reviewsWithUser = await Promise.all(reviews.map(async (review) => {
                const user = await User_1.UserModel.findById(review.user_id);
                return {
                    review_id: review.review_id,
                    user: user
                        ? {
                            user_id: user.user_id,
                            fullname: user.fullname,
                            username: user.username,
                            avatar_path: user.avatar_path,
                        }
                        : null,
                    dish_id: review.dish_id,
                    points: Number(review.points),
                    content: review.content,
                    created_at: review.created_at,
                    updated_at: review.updated_at,
                };
            }));
            // Lấy tổng số reviews
            const totalReviews = await Review_1.ReviewModel.countByDish(dishId);
            const totalPages = Math.ceil(totalReviews / limitNum);
            // Lấy thống kê đánh giá
            const stats = await Review_1.ReviewModel.getStatsByDish(dishId);
            return response_1.default.success(res, "Lấy danh sách đánh giá thành công", {
                reviews: reviewsWithUser,
                pagination: {
                    page: pageNum,
                    limit: limitNum,
                    total: totalReviews,
                    totalPages,
                },
                statistics: {
                    average_rating: stats.average_rating ? Number(stats.average_rating).toFixed(1) : "0.0",
                    total_reviews: stats.total_reviews || 0,
                    rating_distribution: stats.rating_distribution || {
                        5: 0,
                        4: 0,
                        3: 0,
                        2: 0,
                        1: 0,
                    },
                },
            });
        }
        catch (error) {
            console.error("Get reviews by dish error:", error);
            return response_1.default.error(res, "Lỗi server", 500);
        }
    }
    // Lấy reviews của user
    static async getReviewsByUser(req, res) {
        try {
            const user_id = req.user?.user_id;
            if (!user_id) {
                return response_1.default.error(res, "Unauthorized", 401);
            }
            const { page = 1, limit = 10 } = req.query;
            const pageNum = Math.max(1, parseInt(String(page), 10) || 1);
            const limitNum = Math.max(1, parseInt(String(limit), 10) || 10);
            const offset = (pageNum - 1) * limitNum;
            const reviews = await Review_1.ReviewModel.findByUser(user_id, limitNum, offset);
            // Lấy thông tin món ăn cho mỗi review
            const reviewsWithDish = await Promise.all(reviews.map(async (review) => {
                const dish = await Dish_1.DishModel.findById(review.dish_id);
                return {
                    review_id: review.review_id,
                    dish: dish
                        ? {
                            dish_id: dish.dish_id,
                            name: dish.name,
                            thumbnail_path: dish.thumbnail_path,
                            price: Number(dish.price),
                        }
                        : null,
                    points: Number(review.points),
                    content: review.content,
                    created_at: review.created_at,
                    updated_at: review.updated_at,
                };
            }));
            const totalReviews = await Review_1.ReviewModel.countByUser(user_id);
            const totalPages = Math.ceil(totalReviews / limitNum);
            return response_1.default.success(res, "Lấy danh sách đánh giá của bạn thành công", {
                reviews: reviewsWithDish,
                pagination: {
                    page: pageNum,
                    limit: limitNum,
                    total: totalReviews,
                    totalPages,
                },
            });
        }
        catch (error) {
            console.error("Get reviews by user error:", error);
            return response_1.default.error(res, "Lỗi server", 500);
        }
    }
    // Cập nhật review
    static async updateReview(req, res) {
        try {
            const { reviewId } = req.params;
            const { points, content } = req.body;
            const user_id = req.user?.user_id;
            if (!user_id) {
                return response_1.default.error(res, "Unauthorized", 401);
            }
            // Kiểm tra review tồn tại
            const review = await Review_1.ReviewModel.findById(reviewId);
            if (!review) {
                return response_1.default.error(res, "Không tìm thấy đánh giá", 404);
            }
            // Kiểm tra quyền sở hữu
            if (review.user_id !== user_id) {
                return response_1.default.error(res, "Bạn không có quyền chỉnh sửa đánh giá này", 403);
            }
            // Validate
            if (points !== undefined && (points < 0 || points > 5)) {
                return response_1.default.error(res, "Điểm đánh giá phải từ 0 đến 5", 400);
            }
            const updateData = {};
            if (points !== undefined)
                updateData.points = Number(points);
            if (content !== undefined)
                updateData.content = String(content).trim();
            if (Object.keys(updateData).length === 0) {
                return response_1.default.error(res, "Không có thông tin để cập nhật", 400);
            }
            await Review_1.ReviewModel.update(reviewId, updateData);
            // Cập nhật lại điểm trung bình của món ăn
            await Review_1.ReviewModel.updateDishRating(review.dish_id);
            return response_1.default.success(res, "Cập nhật đánh giá thành công");
        }
        catch (error) {
            console.error("Update review error:", error);
            return response_1.default.error(res, "Lỗi server", 500);
        }
    }
    // Xóa review
    static async deleteReview(req, res) {
        try {
            const { reviewId } = req.params;
            const user_id = req.user?.user_id;
            if (!user_id) {
                return response_1.default.error(res, "Unauthorized", 401);
            }
            // Kiểm tra review tồn tại
            const review = await Review_1.ReviewModel.findById(reviewId);
            if (!review) {
                return response_1.default.error(res, "Không tìm thấy đánh giá", 404);
            }
            // Kiểm tra quyền sở hữu
            if (review.user_id !== user_id) {
                return response_1.default.error(res, "Bạn không có quyền xóa đánh giá này", 403);
            }
            const dish_id = review.dish_id;
            await Review_1.ReviewModel.delete(reviewId);
            // Cập nhật lại điểm trung bình của món ăn
            await Review_1.ReviewModel.updateDishRating(dish_id);
            return response_1.default.success(res, "Xóa đánh giá thành công");
        }
        catch (error) {
            console.error("Delete review error:", error);
            return response_1.default.error(res, "Lỗi server", 500);
        }
    }
    // Lấy thống kê đánh giá của một món ăn
    static async getReviewStats(req, res) {
        try {
            const { dishId } = req.params;
            // Kiểm tra món ăn tồn tại
            const dish = await Dish_1.DishModel.findById(dishId);
            if (!dish) {
                return response_1.default.error(res, "Không tìm thấy món ăn", 404);
            }
            const stats = await Review_1.ReviewModel.getStatsByDish(dishId);
            return response_1.default.success(res, "Lấy thống kê đánh giá thành công", {
                dish_id: dishId,
                dish_name: dish.name,
                average_rating: stats.average_rating ? Number(stats.average_rating).toFixed(1) : "0.0",
                total_reviews: stats.total_reviews || 0,
                rating_distribution: stats.rating_distribution || {
                    5: 0,
                    4: 0,
                    3: 0,
                    2: 0,
                    1: 0,
                },
            });
        }
        catch (error) {
            console.error("Get review stats error:", error);
            return response_1.default.error(res, "Lỗi server", 500);
        }
    }
}
exports.ReviewController = ReviewController;
