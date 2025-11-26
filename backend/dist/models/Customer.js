"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomerModel = void 0;
const db_1 = __importDefault(require("../database/db"));
exports.CustomerModel = {
    async findByUserId(userId) {
        const [rows] = await db_1.default.query("SELECT * FROM Customers WHERE user_id = ? LIMIT 1", [userId]);
        return rows[0] || null;
    },
    async create(userId) {
        const [result] = await db_1.default.query("INSERT INTO Customers (user_id) VALUES (?)", [userId]);
        return result.insertId || null;
    },
};
