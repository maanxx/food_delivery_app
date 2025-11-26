import { InvoiceItemsModel } from "../models/InvoiceItems";
import ResponseUtils from "../utils/response";

export class InvoiceItemsController {
    // Lấy chi tiết các món trong hóa đơn
    static async getInvoiceItems(req, res) {
        try {
            const { invoice_id } = req.params;
            const items = await InvoiceItemsModel.findByInvoiceId(invoice_id);
            return ResponseUtils.success(res, "Lấy chi tiết món hóa đơn thành công", items);
        } catch (err) {
            return ResponseUtils.error(res, err.message || "Lỗi server", 500);
        }
    }
}
