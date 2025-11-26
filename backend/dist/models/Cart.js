"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CartModel = void 0;
const db_1 = __importDefault(require("../database/db"));
exports.CartModel = {
    async findByUserId(userId) {
        const [rows] = await db_1.default.query("SELECT * FROM Carts WHERE user_id = ? LIMIT 1", [userId]);
        return rows[0] || null;
    },
    async create(userId) {
        const [result] = await db_1.default.query("INSERT INTO Carts (user_id) VALUES (?)", [userId]);
        return result.insertId || null;
    },
};
