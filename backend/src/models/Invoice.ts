import pool from "../database/db";

export const InvoiceModel = {
    async create(data: any) {
        const [result]: any = await pool.query(
            "INSERT INTO Invoices (customer_id, employee_id, shipping_fee, discount_amount, total_amount, payment_method, status) VALUES (?,?,?,?,?,?,?)",
            [
                data.customer_id,
                data.employee_id,
                data.shipping_fee,
                data.discount_amount,
                data.total_amount,
                data.payment_method || "Cash",
                data.status || "Pending",
            ],
        );
        return result.insertId || null;
    },

    async findById(id: string) {
        const [rows]: any = await pool.query("SELECT * FROM Invoices WHERE invoice_id = ? LIMIT 1", [id]);
        return rows[0] || null;
    },
};
