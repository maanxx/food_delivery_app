"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderModel = void 0;
const db_1 = __importDefault(require("../database/db"));
exports.OrderModel = {
    async create(data) {
        const [result] = await db_1.default.query("INSERT INTO Orders (user_id, quantity, foods, order_note, order_status) VALUES (?,?,?,?,?)", [data.user_id, data.quantity, data.foods, data.order_note || null, data.order_status || "Pending"]);
        return result.insertId || null;
    },
    async findById(orderId) {
        const [rows] = await db_1.default.query("SELECT * FROM Orders WHERE order_id = ? LIMIT 1", [orderId]);
        return rows[0] || null;
    },
};
