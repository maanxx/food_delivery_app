import pool from "../database/db";

export const CartModel = {
    async findByUserId(userId: string) {
        const [rows]: any = await pool.query("SELECT * FROM Carts WHERE user_id = ? LIMIT 1", [userId]);
        return rows[0] || null;
    },

    async create(userId: string) {
        const [result]: any = await pool.query("INSERT INTO Carts (user_id) VALUES (?)", [userId]);
        return result.insertId || null;
    },
};
