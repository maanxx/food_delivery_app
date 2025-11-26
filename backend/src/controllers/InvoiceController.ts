import { InvoiceModel } from "../models/Invoice";
import ResponseUtils from "../utils/response";

export class InvoiceController {
    // Lấy danh sách hóa đơn của user
    static async getInvoices(req, res) {
        try {
            const { user_id } = req.params;
            const invoices = await InvoiceModel.findByUser(user_id);
            console.log("Invoices: ", invoices);
            return ResponseUtils.success(res, "Lấy danh sách hóa đơn thành công", invoices);
        } catch (err) {
            return ResponseUtils.error(res, err.message || "Lỗi server", 500);
        }
    }

    // Tạo hóa đơn mới
    static async createInvoice(req, res) {
        try {
            const { user_id, items, total, payment_method } = req.body;
            console.log("Received createInvoice params:", { user_id, items, total, payment_method });
            if (!user_id) {
                return ResponseUtils.error(res, "Thiếu user_id (employee_id)", 400);
            }
            const invoice_id = await InvoiceModel.create({ user_id, items, total, payment_method });
            if (invoice_id) {
                return ResponseUtils.success(res, "Tạo hóa đơn thành công", { invoice_id });
            } else {
                return ResponseUtils.error(res, "Không thể tạo hóa đơn (không tìm thấy customer_id)", 400);
            }
        } catch (err) {
            console.error("Invoice create error:", err);
            return ResponseUtils.error(res, err.message || "Lỗi server", 500);
        }
    }

    // Lấy chi tiết hóa đơn
    static async getInvoiceDetail(req, res) {
        try {
            const { invoice_id } = req.params;
            const invoice = await InvoiceModel.findById(invoice_id);
            if (invoice) {
                return ResponseUtils.success(res, "Lấy chi tiết hóa đơn thành công", invoice);
            } else {
                return ResponseUtils.error(res, "Không tìm thấy hóa đơn", 404);
            }
        } catch (err) {
            return ResponseUtils.error(res, err.message || "Lỗi server", 500);
        }
    }
}
