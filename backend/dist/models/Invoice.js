"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvoiceModel = void 0;
const db_1 = __importDefault(require("../database/db"));
const uuid_1 = require("uuid");
exports.InvoiceModel = {
    async findByUser(user_id) {
        const [rows] = await db_1.default.query("SELECT * FROM Invoices WHERE customer_id = ? ORDER BY created_at DESC", [
            user_id,
        ]);
        return rows;
    },
    async findById(invoice_id) {
        const [rows] = await db_1.default.query("SELECT * FROM Invoices WHERE invoice_id = ? LIMIT 1", [invoice_id]);
        return rows[0] || null;
    },
    async create({ user_id, items, total, payment_method }) {
        const [rows] = await db_1.default.query("SELECT customer_id FROM Customers WHERE customer_id = ? LIMIT 1", [
            user_id,
        ]);
        if (!rows || rows.length === 0) {
            await db_1.default.query("INSERT INTO Customers (customer_id, user_id, loyal_points) VALUES (?, ?, 0)", [
                user_id,
                user_id,
            ]);
        }
        const invoice_id = (0, uuid_1.v4)();
        const employee_id = user_id;
        const shipping_fee = 20000;
        const discount_amount = 0;
        const total_amount = total;
        const status = "Paid";
        let dbPaymentMethod = payment_method;
        if (payment_method === "vnpay")
            dbPaymentMethod = "Bank Transfer";
        const customer_id = user_id;
        await db_1.default.query("INSERT INTO Invoices (invoice_id, customer_id, employee_id, shipping_fee, discount_amount, total_amount, payment_method, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", [
            invoice_id,
            customer_id,
            customer_id,
            shipping_fee,
            discount_amount,
            total_amount,
            dbPaymentMethod,
            status,
        ]);
        // Lưu từng món vào InvoiceItems
        for (const item of items) {
            await db_1.default.query("INSERT INTO InvoiceItems (invoice_item_id, invoice_id, dish_id, quantity, price) VALUES (?, ?, ?, ?, ?)", [(0, uuid_1.v4)(), invoice_id, item.id, item.quantity, item.price]);
        }
        return invoice_id;
    },
};
