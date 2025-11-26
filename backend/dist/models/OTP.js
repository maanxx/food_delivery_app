"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OTPModel = void 0;
const db_1 = __importDefault(require("../database/db"));
exports.OTPModel = {
    async create(info, country_code, otp, expiresAt) {
        const [result] = await db_1.default.query("INSERT INTO OTP (info, country_code, otp, expires_at) VALUES (?,?,?,?)", [info, country_code, otp, expiresAt]);
        return result.insertId || null;
    },
    async findValid(info) {
        const [rows] = await db_1.default.query("SELECT * FROM OTP WHERE info = ? AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1", [info]);
        return rows[0] || null;
    },
    async invalidate(otpId) {
        const [result] = await db_1.default.query("DELETE FROM OTP WHERE otp_id = ?", [otpId]);
        return result.affectedRows > 0;
    },
};
