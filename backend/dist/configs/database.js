"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.testConnection = void 0;
const promise_1 = __importDefault(require("mysql2/promise"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const dbConfig = {
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "nooba",
    password: process.env.DB_PASSWORD || "noobanecon",
    database: process.env.DB_NAME || "eatsy_food",
    port: parseInt(process.env.DB_PORT || "3306"),
    ssl: false,
    connectionLimit: 10,
    acquireTimeout: 60000,
    timeout: 60000,
    reconnect: true,
};
// Create connection pool
const pool = promise_1.default.createPool(dbConfig);
exports.default = pool;
// Test connection
const testConnection = async () => {
    try {
        const connection = await pool.getConnection();
        console.log("✅ Database connected successfully");
        connection.release();
        return true;
    }
    catch (error) {
        console.error("❌ Database connection failed:", error);
        return false;
    }
};
exports.testConnection = testConnection;
