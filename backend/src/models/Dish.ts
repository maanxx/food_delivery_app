import pool from "../database/db";

export const DishModel = {
    async findById(id: string) {
        const [rows]: any = await pool.query("SELECT * FROM Dishes WHERE dish_id = ? LIMIT 1", [id]);
        return rows[0] || null;
    },

    async findByCategory(categoryId: string) {
        const [rows]: any = await pool.query("SELECT * FROM Dishes WHERE category_id = ?", [categoryId]);
        return rows;
    },

    async list(limit = 50, offset = 0) {
        const [rows]: any = await pool.query("SELECT * FROM Dishes ORDER BY created_at DESC LIMIT ? OFFSET ?", [
            limit,
            offset,
        ]);
        return rows;
    },

    async create(data: any) {
        const [result]: any = await pool.query(
            "INSERT INTO Dishes (category_id, thumbnail_path, name, description, price, available, points, rate_quantity, discount_amount) VALUES (?,?,?,?,?,?,?,?,?)",
            [
                data.category_id,
                data.thumbnail_path,
                data.name,
                data.description || null,
                data.price,
                data.available ?? 1,
                data.points ?? 0,
                data.rate_quantity ?? 0,
                data.discount_amount ?? 0,
            ],
        );
        return result.insertId || null;
    },
};
