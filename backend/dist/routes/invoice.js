"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const InvoiceController_1 = require("../controllers/InvoiceController");
const router = express_1.default.Router();
// Lấy danh sách hóa đơn của user
router.get("/:user_id", InvoiceController_1.InvoiceController.getInvoices);
// Tạo hóa đơn mới
router.post("/create", InvoiceController_1.InvoiceController.createInvoice);
// Lấy chi tiết hóa đơn
router.get("/detail/:invoice_id", InvoiceController_1.InvoiceController.getInvoiceDetail);
exports.default = router;
