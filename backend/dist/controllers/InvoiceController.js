"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvoiceController = void 0;
const Invoice_1 = require("../models/Invoice");
const response_1 = __importDefault(require("../utils/response"));
class InvoiceController {
    // Lấy danh sách hóa đơn của user
    static async getInvoices(req, res) {
        try {
            const { user_id } = req.params;
            const invoices = await Invoice_1.InvoiceModel.findByUser(user_id);
            console.log("Invoices: ", invoices);
            return response_1.default.success(res, "Lấy danh sách hóa đơn thành công", invoices);
        }
        catch (err) {
            return response_1.default.error(res, err.message || "Lỗi server", 500);
        }
    }
    // Tạo hóa đơn mới
    static async createInvoice(req, res) {
        try {
            const { user_id, items, total, payment_method } = req.body;
            console.log("Received createInvoice params:", { user_id, items, total, payment_method });
            if (!user_id) {
                return response_1.default.error(res, "Thiếu user_id (employee_id)", 400);
            }
            const invoice_id = await Invoice_1.InvoiceModel.create({ user_id, items, total, payment_method });
            if (invoice_id) {
                return response_1.default.success(res, "Tạo hóa đơn thành công", { invoice_id });
            }
            else {
                return response_1.default.error(res, "Không thể tạo hóa đơn (không tìm thấy customer_id)", 400);
            }
        }
        catch (err) {
            console.error("Invoice create error:", err);
            return response_1.default.error(res, err.message || "Lỗi server", 500);
        }
    }
    // Lấy chi tiết hóa đơn
    static async getInvoiceDetail(req, res) {
        try {
            const { invoice_id } = req.params;
            const invoice = await Invoice_1.InvoiceModel.findById(invoice_id);
            if (invoice) {
                return response_1.default.success(res, "Lấy chi tiết hóa đơn thành công", invoice);
            }
            else {
                return response_1.default.error(res, "Không tìm thấy hóa đơn", 404);
            }
        }
        catch (err) {
            return response_1.default.error(res, err.message || "Lỗi server", 500);
        }
    }
}
exports.InvoiceController = InvoiceController;
