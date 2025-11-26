"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategoryModel = void 0;
const db_1 = __importDefault(require("../database/db"));
exports.CategoryModel = {
    async findAll() {
        const [rows] = await db_1.default.query("SELECT * FROM Categories ORDER BY created_at DESC");
        return rows;
    },
    async findById(id) {
        const [rows] = await db_1.default.query("SELECT * FROM Categories WHERE category_id = ? LIMIT 1", [id]);
        return rows[0] || null;
    },
    async findByName(name) {
        const [rows] = await db_1.default.query("SELECT * FROM Categories WHERE name = ? LIMIT 1", [name]);
        return rows[0] || null;
    },
    async create(data) {
        const [result] = await db_1.default.query("INSERT INTO Categories (name, description) VALUES (?, ?)", [
            data.name,
            data.description || null,
        ]);
        return result.insertId || null;
    },
};
