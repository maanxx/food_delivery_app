"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VoucherModel = void 0;
const db_1 = __importDefault(require("../database/db"));
exports.VoucherModel = {
    async findByCode(code) {
        const [rows] = await db_1.default.query("SELECT * FROM Vouchers WHERE code = ? LIMIT 1", [code]);
        return rows[0] || null;
    },
    async useVoucher(userId, voucherId) {
        const [result] = await db_1.default.query("INSERT INTO UserVoucher (user_id, voucher_id, used_at) VALUES (?,?,NOW())", [userId, voucherId]);
        return result.affectedRows > 0;
    },
};
