import pool from "../database/db";

export const OrderModel = {
    async create(data: any) {
        const [result]: any = await pool.query(
            "INSERT INTO Orders (user_id, quantity, foods, order_note, order_status) VALUES (?,?,?,?,?)",
            [data.user_id, data.quantity, data.foods, data.order_note || null, data.order_status || "Pending"],
        );
        return result.insertId || null;
    },

    async findById(orderId: string) {
        const [rows]: any = await pool.query("SELECT * FROM Orders WHERE order_id = ? LIMIT 1", [orderId]);
        return rows[0] || null;
    },
};
