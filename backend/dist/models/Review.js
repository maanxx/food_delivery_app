"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReviewModel = void 0;
const db_1 = __importDefault(require("../database/db"));
exports.ReviewModel = {
    async create(data) {
        const [result] = await db_1.default.query("INSERT INTO Reviews (user_id, dish_id, points, content) VALUES (?,?,?,?)", [data.user_id, data.dish_id, data.points, data.content]);
        return result.insertId || null;
    },
    async findByDish(dishId, limit = 10, offset = 0, sort = "desc") {
        const order = sort.toLowerCase() === "asc" ? "ASC" : "DESC";
        const [rows] = await db_1.default.query(`SELECT * FROM Reviews WHERE dish_id = ? ORDER BY created_at ${order} LIMIT ? OFFSET ?`, [dishId, limit, offset]);
        return rows;
    },
    async findByUser(userId, limit = 10, offset = 0) {
        const [rows] = await db_1.default.query("SELECT * FROM Reviews WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?", [userId, limit, offset]);
        return rows;
    },
    async findById(reviewId) {
        const [rows] = await db_1.default.query("SELECT * FROM Reviews WHERE review_id = ?", [reviewId]);
        return rows[0] || null;
    },
    async update(reviewId, data) {
        const fields = [];
        const values = [];
        if (data.points !== undefined) {
            fields.push("points = ?");
            values.push(data.points);
        }
        if (data.content !== undefined) {
            fields.push("content = ?");
            values.push(data.content);
        }
        if (fields.length === 0)
            return;
        values.push(reviewId);
        const [result] = await db_1.default.query(`UPDATE Reviews SET ${fields.join(", ")} WHERE review_id = ?`, values);
        return result.affectedRows > 0;
    },
    async delete(reviewId) {
        const [result] = await db_1.default.query("DELETE FROM Reviews WHERE review_id = ?", [reviewId]);
        return result.affectedRows > 0;
    },
    async countByDish(dishId) {
        const [rows] = await db_1.default.query("SELECT COUNT(*) as total FROM Reviews WHERE dish_id = ?", [dishId]);
        return rows[0]?.total || 0;
    },
    async countByUser(userId) {
        const [rows] = await db_1.default.query("SELECT COUNT(*) as total FROM Reviews WHERE user_id = ?", [userId]);
        return rows[0]?.total || 0;
    },
    async getStatsByDish(dishId) {
        // Lấy điểm trung bình và tổng số đánh giá
        const [avgRows] = await db_1.default.query("SELECT AVG(points) as average_rating, COUNT(*) as total_reviews FROM Reviews WHERE dish_id = ?", [dishId]);
        // Lấy phân bố đánh giá theo từng mức điểm
        const [distRows] = await db_1.default.query(`SELECT 
                SUM(CASE WHEN points >= 4.5 THEN 1 ELSE 0 END) as rating_5,
                SUM(CASE WHEN points >= 3.5 AND points < 4.5 THEN 1 ELSE 0 END) as rating_4,
                SUM(CASE WHEN points >= 2.5 AND points < 3.5 THEN 1 ELSE 0 END) as rating_3,
                SUM(CASE WHEN points >= 1.5 AND points < 2.5 THEN 1 ELSE 0 END) as rating_2,
                SUM(CASE WHEN points < 1.5 THEN 1 ELSE 0 END) as rating_1
            FROM Reviews WHERE dish_id = ?`, [dishId]);
        return {
            average_rating: avgRows[0]?.average_rating || 0,
            total_reviews: avgRows[0]?.total_reviews || 0,
            rating_distribution: {
                5: distRows[0]?.rating_5 || 0,
                4: distRows[0]?.rating_4 || 0,
                3: distRows[0]?.rating_3 || 0,
                2: distRows[0]?.rating_2 || 0,
                1: distRows[0]?.rating_1 || 0,
            },
        };
    },
    async updateDishRating(dishId) {
        // Cập nhật điểm trung bình và số lượng đánh giá của món ăn
        const [result] = await db_1.default.query(`UPDATE Dishes SET 
                points = (SELECT COALESCE(AVG(points), 0) FROM Reviews WHERE dish_id = ?),
                rate_quantity = (SELECT COUNT(*) FROM Reviews WHERE dish_id = ?)
            WHERE dish_id = ?`, [dishId, dishId, dishId]);
        return result.affectedRows > 0;
    },
};
