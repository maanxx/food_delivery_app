import pool from "../database/db";

export const OTPModel = {
    async create(info: string, country_code: string | null, otp: string, expiresAt: Date) {
        const [result]: any = await pool.query(
            "INSERT INTO OTP (info, country_code, otp, expires_at) VALUES (?,?,?,?)",
            [info, country_code, otp, expiresAt],
        );
        return result.insertId || null;
    },

    async findValid(info: string) {
        const [rows]: any = await pool.query(
            "SELECT * FROM OTP WHERE info = ? AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1",
            [info],
        );
        return rows[0] || null;
    },

    async invalidate(otpId: string) {
        const [result]: any = await pool.query("DELETE FROM OTP WHERE otp_id = ?", [otpId]);
        return result.affectedRows > 0;
    },
};
