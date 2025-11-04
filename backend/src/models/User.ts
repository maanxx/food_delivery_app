import { RowDataPacket, ResultSetHeader } from "mysql2";
import pool from "../configs/database";
import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";

export interface User {
    user_id: string;
    fullname?: string;
    address?: string;
    gender?: "Male" | "Female" | "Other";
    date_of_birth?: Date;
    password: string;
    username?: string;
    type_login: "Standard" | "Google" | "Facebook" | "Apple";
    email: string;
    phone_number: string;
    country_code: string;
    role: "Admin" | "Customer" | "Owner" | "Employee";
    avatar_path?: string;
    payment_method?: "Credit Card" | "Momo" | "Zalo Pay" | "Bank Transfer" | "Cash";
    created_at?: Date;
    updated_at?: Date;
    last_login?: Date;
    is_online?: boolean;
}

export interface UserRow extends RowDataPacket, User {}

export class UserModel {
    // Create new user
    static async create(userData: Partial<User>): Promise<string> {
        const connection = await pool.getConnection();
        try {
            const userId = uuidv4();
            const hashedPassword = await bcrypt.hash(userData.password!, 10);

            const query = `
                INSERT INTO Users (
                    user_id, fullname, email, phone_number, country_code, 
                    password, type_login, role, is_online
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;

            await connection.execute<ResultSetHeader>(query, [
                userId,
                userData.fullname || null,
                userData.email,
                userData.phone_number,
                userData.country_code || "+84",
                hashedPassword,
                userData.type_login || "Standard",
                userData.role || "Customer",
                true,
            ]);

            // Create customer record if role is Customer
            if (userData.role === "Customer" || !userData.role) {
                const customerQuery = `INSERT INTO Customers (user_id) VALUES (?)`;
                await connection.execute<ResultSetHeader>(customerQuery, [userId]);
            }

            return userId;
        } finally {
            connection.release();
        }
    }

    // Find user by email
    static async findByEmail(email: string): Promise<UserRow | null> {
        const connection = await pool.getConnection();
        try {
            const query = `SELECT * FROM Users WHERE email = ?`;
            const [rows] = await connection.execute<UserRow[]>(query, [email]);

            return rows.length > 0 ? rows[0] : null;
        } finally {
            connection.release();
        }
    }

    // Find user by phone number
    static async findByPhone(phone_number: string): Promise<UserRow | null> {
        const connection = await pool.getConnection();
        try {
            const query = `SELECT * FROM Users WHERE phone_number = ?`;
            const [rows] = await connection.execute<UserRow[]>(query, [phone_number]);

            return rows.length > 0 ? rows[0] : null;
        } finally {
            connection.release();
        }
    }

    // Find user by ID
    static async findById(userId: string): Promise<UserRow | null> {
        const connection = await pool.getConnection();
        try {
            const query = `SELECT * FROM Users WHERE user_id = ?`;
            const [rows] = await connection.execute<UserRow[]>(query, [userId]);

            return rows.length > 0 ? rows[0] : null;
        } finally {
            connection.release();
        }
    }

    // Verify password
    static async verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
        return await bcrypt.compare(plainPassword, hashedPassword);
    }

    // Update last login
    static async updateLastLogin(userId: string): Promise<void> {
        const connection = await pool.getConnection();
        try {
            const query = `UPDATE Users SET last_login = NOW(), is_online = true WHERE user_id = ?`;
            await connection.execute<ResultSetHeader>(query, [userId]);
        } finally {
            connection.release();
        }
    }

    // Update user profile
    static async update(userId: string, updateData: Partial<User>): Promise<boolean> {
        const connection = await pool.getConnection();
        try {
            const fields = [];
            const values = [];

            // Build dynamic update query
            for (const [key, value] of Object.entries(updateData)) {
                if (key !== "user_id" && value !== undefined) {
                    if (key === "password") {
                        fields.push(`${key} = ?`);
                        values.push(await bcrypt.hash(value as string, 10));
                    } else {
                        fields.push(`${key} = ?`);
                        values.push(value);
                    }
                }
            }

            if (fields.length === 0) return false;

            const query = `UPDATE Users SET ${fields.join(", ")}, updated_at = NOW() WHERE user_id = ?`;
            values.push(userId);

            const [result] = await connection.execute<ResultSetHeader>(query, values);
            return result.affectedRows > 0;
        } finally {
            connection.release();
        }
    }

    // Set user offline
    static async setOffline(userId: string): Promise<void> {
        const connection = await pool.getConnection();
        try {
            const query = `UPDATE Users SET is_online = false WHERE user_id = ?`;
            await connection.execute<ResultSetHeader>(query, [userId]);
        } finally {
            connection.release();
        }
    }

    // Check if email exists
    static async emailExists(email: string, excludeUserId?: string): Promise<boolean> {
        const connection = await pool.getConnection();
        try {
            let query = `SELECT COUNT(*) as count FROM Users WHERE email = ?`;
            const params: (string | undefined)[] = [email];

            if (excludeUserId) {
                query += ` AND user_id != ?`;
                params.push(excludeUserId);
            }

            const [rows] = await connection.execute<RowDataPacket[]>(query, params);
            return rows[0].count > 0;
        } finally {
            connection.release();
        }
    }

    // Check if phone exists
    static async phoneExists(phone_number: string, excludeUserId?: string): Promise<boolean> {
        const connection = await pool.getConnection();
        try {
            let query = `SELECT COUNT(*) as count FROM Users WHERE phone_number = ?`;
            const params: (string | undefined)[] = [phone_number];

            if (excludeUserId) {
                query += ` AND user_id != ?`;
                params.push(excludeUserId);
            }

            const [rows] = await connection.execute<RowDataPacket[]>(query, params);
            return rows[0].count > 0;
        } finally {
            connection.release();
        }
    }
}
