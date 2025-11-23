import pool from "../database/db";

export const CategoryModel = {
    async findAll() {
        const [rows]: any = await pool.query("SELECT * FROM Categories ORDER BY created_at DESC");
        return rows;
    },

    async findById(id: string) {
        const [rows]: any = await pool.query("SELECT * FROM Categories WHERE category_id = ? LIMIT 1", [id]);
        return rows[0] || null;
    },

    async findByName(name: string) {
        const [rows]: any = await pool.query("SELECT * FROM Categories WHERE name = ? LIMIT 1", [name]);
        return rows[0] || null;
    },

    async create(data: { name: string; description?: string }) {
        const [result]: any = await pool.query("INSERT INTO Categories (name, description) VALUES (?, ?)", [
            data.name,
            data.description || null,
        ]);
        return result.insertId || null;
    },
};
