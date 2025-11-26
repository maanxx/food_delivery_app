"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CartItemModel = void 0;
const db_1 = __importDefault(require("../database/db"));
exports.CartItemModel = {
    async findByCartId(cartId) {
        const [rows] = await db_1.default.query("SELECT * FROM CartItems WHERE cart_id = ?", [cartId]);
        return rows;
    },
    async add(cartId, dishId, quantity = 1) {
        const [result] = await db_1.default.query("INSERT INTO CartItems (cart_id, dish_id, quantity) VALUES (?,?,?)", [
            cartId,
            dishId,
            quantity,
        ]);
        return result.insertId || null;
    },
    async updateQuantity(cartItemId, quantity) {
        const [result] = await db_1.default.query("UPDATE CartItems SET quantity = ? WHERE cart_item_id = ?", [
            quantity,
            cartItemId,
        ]);
        return result.affectedRows > 0;
    },
    async remove(cartItemId) {
        const [result] = await db_1.default.query("DELETE FROM CartItems WHERE cart_item_id = ?", [cartItemId]);
        return result.affectedRows > 0;
    },
};
