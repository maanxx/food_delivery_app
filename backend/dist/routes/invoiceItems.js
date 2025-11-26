"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const InvoiceItemsController_1 = require("../controllers/InvoiceItemsController");
const router = express_1.default.Router();
// Lấy chi tiết các món trong hóa đơn
router.get("/:invoice_id/items", InvoiceItemsController_1.InvoiceItemsController.getInvoiceItems);
exports.default = router;
