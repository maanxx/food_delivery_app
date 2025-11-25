import express from "express";
import { InvoiceItemsController } from "../controllers/InvoiceItemsController";

const router = express.Router();

// Lấy chi tiết các món trong hóa đơn
router.get("/:invoice_id/items", InvoiceItemsController.getInvoiceItems);

export default router;
