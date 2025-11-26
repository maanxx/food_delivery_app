"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvoiceItemsModel = void 0;
const db_1 = __importDefault(require("../database/db"));
exports.InvoiceItemsModel = {
    async findByInvoiceId(invoice_id) {
        // Trả về tất cả các món trong hóa đơn này
        const [rows] = await db_1.default.query(`SELECT ii.*, d.name as dish_name, d.thumbnail_path
             FROM InvoiceItems ii
             JOIN Dishes d ON ii.dish_id = d.dish_id
             WHERE ii.invoice_id = ?`, [invoice_id]);
        return rows;
    },
};
