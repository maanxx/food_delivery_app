import pool from "../database/db";

export const InvoiceItemsModel = {
    async findByInvoiceId(invoice_id: string) {
        // Trả về tất cả các món trong hóa đơn này
        const [rows]: any = await pool.query(
            `SELECT ii.*, d.name as dish_name, d.thumbnail_path
             FROM InvoiceItems ii
             JOIN Dishes d ON ii.dish_id = d.dish_id
             WHERE ii.invoice_id = ?`,
            [invoice_id],
        );
        return rows;
    },
};
