"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const index_1 = __importDefault(require("./middlewares/index"));
const index_2 = __importDefault(require("./routes/index"));
const app = (0, express_1.default)();
// middlewares
(0, index_1.default)(app);
// routes
(0, index_2.default)(app);
exports.default = app;
