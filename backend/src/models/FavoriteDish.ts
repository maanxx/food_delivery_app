import pool from "../database/db";
import { v4 as uuidv4 } from "uuid";

export const FavoriteDishModel = {
    async findById(favorite_id: string) {
        const [rows]: any = await pool.query("SELECT * FROM FavoriteDishes WHERE favorite_id = ? LIMIT 1", [
            favorite_id,
        ]);
        return rows[0] || null;
    },

    async findByUser(user_id: string) {
        const [rows]: any = await pool.query(
            "SELECT * FROM FavoriteDishes WHERE user_id = ? ORDER BY created_at DESC",
            [user_id],
        );
        return rows;
    },

    async add(user_id: string, dish_id: string) {
        const favorite_id = uuidv4();
        const [result]: any = await pool.query(
            "INSERT INTO FavoriteDishes (favorite_id, user_id, dish_id) VALUES (?, ?, ?)",
            [favorite_id, user_id, dish_id],
        );
        return favorite_id;
    },

    async remove(user_id: string, dish_id: string) {
        const [result]: any = await pool.query("DELETE FROM FavoriteDishes WHERE user_id = ? AND dish_id = ?", [
            user_id,
            dish_id,
        ]);
        return result.affectedRows > 0;
    },

    async list(limit = 50, offset = 0) {
        const [rows]: any = await pool.query("SELECT * FROM FavoriteDishes ORDER BY created_at DESC LIMIT ? OFFSET ?", [
            limit,
            offset,
        ]);
        return rows;
    },
};
