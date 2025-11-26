import pool from "../database/db";

export const CartItemModel = {
    async findByCartId(cartId: string) {
        const [rows]: any = await pool.query("SELECT * FROM CartItems WHERE cart_id = ?", [cartId]);
        return rows;
    },

    async add(cartId: string, dishId: string, quantity = 1) {
        const [result]: any = await pool.query("INSERT INTO CartItems (cart_id, dish_id, quantity) VALUES (?,?,?)", [
            cartId,
            dishId,
            quantity,
        ]);
        return result.insertId || null;
    },

    async updateQuantity(cartItemId: string, quantity: number) {
        const [result]: any = await pool.query("UPDATE CartItems SET quantity = ? WHERE cart_item_id = ?", [
            quantity,
            cartItemId,
        ]);
        return result.affectedRows > 0;
    },

    async remove(cartItemId: string) {
        const [result]: any = await pool.query("DELETE FROM CartItems WHERE cart_item_id = ?", [cartItemId]);
        return result.affectedRows > 0;
    },
};
