import pool from "../database/db";

import { v4 as uuidv4 } from "uuid";

export const InvoiceModel = {
    async findByUser(user_id: string) {
        const [rows]: any = await pool.query("SELECT * FROM Invoices WHERE user_id = ? ORDER BY created_at DESC", [
            user_id,
        ]);
        return rows;
    },

    async findById(invoice_id: string) {
        const [rows]: any = await pool.query("SELECT * FROM Invoices WHERE invoice_id = ? LIMIT 1", [invoice_id]);
        return rows[0] || null;
    },

    async create({ user_id, items, total, address, payment_method }) {
        const invoice_id = uuidv4();
        const [result]: any = await pool.query(
            "INSERT INTO Invoices (invoice_id, user_id, items, total, address, payment_method) VALUES (?, ?, ?, ?, ?, ?)",
            [invoice_id, user_id, JSON.stringify(items), total, address, payment_method],
        );
        return invoice_id;
    },
};
