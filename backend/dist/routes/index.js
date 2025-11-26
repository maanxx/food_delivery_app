"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const auth_1 = __importDefault(require("./auth"));
const food_1 = __importDefault(require("./food"));
const review_1 = __importDefault(require("./review"));
const address_1 = __importDefault(require("./address"));
const vnpay_1 = __importDefault(require("./vnpay"));
const favorite_1 = __importDefault(require("./favorite"));
const invoice_1 = __importDefault(require("./invoice"));
const invoiceItems_1 = __importDefault(require("./invoiceItems"));
const groqAI_1 = __importDefault(require("./groqAI"));
const routes = (app) => {
    /* GET */
    app.get("/", (req, res) => {
        res.send("Food Delivery Backend running!");
    });
    // Auth routes
    app.use("/api/auth", auth_1.default);
    // Food routes
    app.use("/api", food_1.default);
    // Review routes
    app.use("/api", review_1.default);
    // Address routes
    app.use("/api", address_1.default);
    // VNPAY routes
    app.use("/api/vnpay", vnpay_1.default);
    // Favorite Dishes routes
    app.use("/api/favorite", favorite_1.default);
    // Invoice routes
    app.use("/api/invoice", invoice_1.default);
    // Invoice Items routes
    app.use("/api/invoice-items", invoiceItems_1.default);
    // OpenAI routes
    app.use("/api/ai", groqAI_1.default);
};
exports.default = routes;
