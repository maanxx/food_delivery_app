import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

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
const pool = mysql.createPool(dbConfig);

export default pool;

// Test connection
export const testConnection = async () => {
    try {
        const connection = await pool.getConnection();
        console.log("✅ Database connected successfully");
        connection.release();
        return true;
    } catch (error) {
        console.error("❌ Database connection failed:", error);
        return false;
    }
};
