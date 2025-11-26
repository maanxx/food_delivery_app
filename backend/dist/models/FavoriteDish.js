"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FavoriteDishModel = void 0;
const db_1 = __importDefault(require("../database/db"));
const uuid_1 = require("uuid");
exports.FavoriteDishModel = {
    async findById(favorite_id) {
        const [rows] = await db_1.default.query("SELECT * FROM FavoriteDishes WHERE favorite_id = ? LIMIT 1", [
            favorite_id,
        ]);
        return rows[0] || null;
    },
    async findByUser(user_id) {
        const [rows] = await db_1.default.query("SELECT * FROM FavoriteDishes WHERE user_id = ? ORDER BY created_at DESC", [user_id]);
        return rows;
    },
    async add(user_id, dish_id) {
        const favorite_id = (0, uuid_1.v4)();
        const [result] = await db_1.default.query("INSERT INTO FavoriteDishes (favorite_id, user_id, dish_id) VALUES (?, ?, ?)", [favorite_id, user_id, dish_id]);
        return favorite_id;
    },
    async remove(user_id, dish_id) {
        const [result] = await db_1.default.query("DELETE FROM FavoriteDishes WHERE user_id = ? AND dish_id = ?", [
            user_id,
            dish_id,
        ]);
        return result.affectedRows > 0;
    },
    async list(limit = 50, offset = 0) {
        const [rows] = await db_1.default.query("SELECT * FROM FavoriteDishes ORDER BY created_at DESC LIMIT ? OFFSET ?", [
            limit,
            offset,
        ]);
        return rows;
    },
};
