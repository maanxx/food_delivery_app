import pool from "../database/db";

export const CustomerModel = {
    async findByUserId(userId: string) {
        const [rows]: any = await pool.query("SELECT * FROM Customers WHERE user_id = ? LIMIT 1", [userId]);
        return rows[0] || null;
    },

    async create(userId: string) {
        const [result]: any = await pool.query("INSERT INTO Customers (user_id) VALUES (?)", [userId]);
        return result.insertId || null;
    },
};
