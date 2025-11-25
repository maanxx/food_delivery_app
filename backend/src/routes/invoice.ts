import express from "express";
import { InvoiceController } from "../controllers/InvoiceController";

const router = express.Router();

// Lấy danh sách hóa đơn của user
router.get("/:user_id", InvoiceController.getInvoices);

// Tạo hóa đơn mới
router.post("/create", InvoiceController.createInvoice);

// Lấy chi tiết hóa đơn
router.get("/detail/:invoice_id", InvoiceController.getInvoiceDetail);

export default router;
