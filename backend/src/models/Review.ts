import pool from "../database/db";

export const ReviewModel = {
    async create(data: { user_id: string; dish_id: string; points: number; content: string }) {
        const [result]: any = await pool.query(
            "INSERT INTO Reviews (user_id, dish_id, points, content) VALUES (?,?,?,?)",
            [data.user_id, data.dish_id, data.points, data.content],
        );
        return result.insertId || null;
    },

    async findByDish(dishId: string, limit: number = 10, offset: number = 0, sort: string = "desc") {
        const order = sort.toLowerCase() === "asc" ? "ASC" : "DESC";
        const [rows]: any = await pool.query(
            `SELECT * FROM Reviews WHERE dish_id = ? ORDER BY created_at ${order} LIMIT ? OFFSET ?`,
            [dishId, limit, offset],
        );
        return rows;
    },

    async findByUser(userId: string, limit: number = 10, offset: number = 0) {
        const [rows]: any = await pool.query(
            "SELECT * FROM Reviews WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?",
            [userId, limit, offset],
        );
        return rows;
    },

    async findById(reviewId: string) {
        const [rows]: any = await pool.query("SELECT * FROM Reviews WHERE review_id = ?", [reviewId]);
        return rows[0] || null;
    },

    async update(reviewId: string, data: { points?: number; content?: string }) {
        const fields: string[] = [];
        const values: any[] = [];

        if (data.points !== undefined) {
            fields.push("points = ?");
            values.push(data.points);
        }
        if (data.content !== undefined) {
            fields.push("content = ?");
            values.push(data.content);
        }

        if (fields.length === 0) return;

        values.push(reviewId);
        const [result]: any = await pool.query(`UPDATE Reviews SET ${fields.join(", ")} WHERE review_id = ?`, values);
        return result.affectedRows > 0;
    },

    async delete(reviewId: string) {
        const [result]: any = await pool.query("DELETE FROM Reviews WHERE review_id = ?", [reviewId]);
        return result.affectedRows > 0;
    },

    async countByDish(dishId: string) {
        const [rows]: any = await pool.query("SELECT COUNT(*) as total FROM Reviews WHERE dish_id = ?", [dishId]);
        return rows[0]?.total || 0;
    },

    async countByUser(userId: string) {
        const [rows]: any = await pool.query("SELECT COUNT(*) as total FROM Reviews WHERE user_id = ?", [userId]);
        return rows[0]?.total || 0;
    },

    async getStatsByDish(dishId: string) {
        // Lấy điểm trung bình và tổng số đánh giá
        const [avgRows]: any = await pool.query(
            "SELECT AVG(points) as average_rating, COUNT(*) as total_reviews FROM Reviews WHERE dish_id = ?",
            [dishId],
        );

        // Lấy phân bố đánh giá theo từng mức điểm
        const [distRows]: any = await pool.query(
            `SELECT 
                SUM(CASE WHEN points >= 4.5 THEN 1 ELSE 0 END) as rating_5,
                SUM(CASE WHEN points >= 3.5 AND points < 4.5 THEN 1 ELSE 0 END) as rating_4,
                SUM(CASE WHEN points >= 2.5 AND points < 3.5 THEN 1 ELSE 0 END) as rating_3,
                SUM(CASE WHEN points >= 1.5 AND points < 2.5 THEN 1 ELSE 0 END) as rating_2,
                SUM(CASE WHEN points < 1.5 THEN 1 ELSE 0 END) as rating_1
            FROM Reviews WHERE dish_id = ?`,
            [dishId],
        );

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

    async updateDishRating(dishId: string) {
        // Cập nhật điểm trung bình và số lượng đánh giá của món ăn
        const [result]: any = await pool.query(
            `UPDATE Dishes SET 
                points = (SELECT COALESCE(AVG(points), 0) FROM Reviews WHERE dish_id = ?),
                rate_quantity = (SELECT COUNT(*) FROM Reviews WHERE dish_id = ?)
            WHERE dish_id = ?`,
            [dishId, dishId, dishId],
        );
        return result.affectedRows > 0;
    },
};
