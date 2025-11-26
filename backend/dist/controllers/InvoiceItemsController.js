"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvoiceItemsController = void 0;
const InvoiceItems_1 = require("../models/InvoiceItems");
const response_1 = __importDefault(require("../utils/response"));
class InvoiceItemsController {
    // Lấy chi tiết các món trong hóa đơn
    static async getInvoiceItems(req, res) {
        try {
            const { invoice_id } = req.params;
            const items = await InvoiceItems_1.InvoiceItemsModel.findByInvoiceId(invoice_id);
            return response_1.default.success(res, "Lấy chi tiết món hóa đơn thành công", items);
        }
        catch (err) {
            return response_1.default.error(res, err.message || "Lỗi server", 500);
        }
    }
}
exports.InvoiceItemsController = InvoiceItemsController;
