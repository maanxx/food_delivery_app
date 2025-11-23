import pool from "../database/db";

export const VoucherModel = {
    async findByCode(code: string) {
        const [rows]: any = await pool.query("SELECT * FROM Vouchers WHERE code = ? LIMIT 1", [code]);
        return rows[0] || null;
    },

    async useVoucher(userId: string, voucherId: string) {
        const [result]: any = await pool.query(
            "INSERT INTO UserVoucher (user_id, voucher_id, used_at) VALUES (?,?,NOW())",
            [userId, voucherId],
        );
        return result.affectedRows > 0;
    },
};
