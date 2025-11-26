import { Request, Response } from "express";
import db from "../database/db";
import { ResultSetHeader, RowDataPacket } from "mysql2";

interface Address {
    id: string;
    user_id: string;
    title: string;
    address: string;
    latitude?: number;
    longitude?: number;
    is_default: boolean;
    created_at: string;
    updated_at: string;
}

interface AddressRequest {
    user_id: string;
    title: string;
    address: string;
    latitude?: number;
    longitude?: number;
    is_default?: boolean;
}

// Get all addresses for a user
export const getUserAddresses = async (req: Request, res: Response): Promise<void> => {
    try {
        const { userId } = req.params;
        if (!userId) {
            res.status(400).json({
                success: false,
                message: "Thiếu userId trong request params",
            });
            return;
        }

        const query = `
            SELECT * FROM addresses 
            WHERE user_id = ? 
            ORDER BY is_default DESC, created_at DESC
        `;

        const [rows] = await db.execute<RowDataPacket[]>(query, [userId]);

        res.status(200).json({
            success: true,
            message: "Addresses retrieved successfully",
            addresses: rows,
        });
    } catch (error) {
        console.error("Error getting user addresses:", error);
        res.status(500).json({
            success: false,
            message: "Failed to get addresses",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};

// Add new address
export const addAddress = async (req: Request, res: Response): Promise<void> => {
    try {
        const { user_id, title, address, latitude, longitude, is_default } = req.body as AddressRequest;

        // Validate required fields
        if (!user_id || !title || !address) {
            res.status(400).json({
                success: false,
                message: "User ID, title, and address are required",
            });
            return;
        }

        // If this is set as default, remove default from other addresses
        if (is_default) {
            await db.execute("UPDATE addresses SET is_default = FALSE WHERE user_id = ?", [user_id]);
        }

        const addressId = `addr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const query = `
            INSERT INTO addresses (id, user_id, title, address, latitude, longitude, is_default, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        `;

        const values = [addressId, user_id, title, address, latitude || null, longitude || null, is_default || false];

        await db.execute<ResultSetHeader>(query, values);

        res.status(201).json({
            success: true,
            message: "Address added successfully",
            address: {
                id: addressId,
                user_id,
                title,
                address,
                latitude: latitude || null,
                longitude: longitude || null,
                is_default: is_default || false,
            },
        });
    } catch (error) {
        console.error("Error adding address:", error);
        res.status(500).json({
            success: false,
            message: "Failed to add address",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};

// Update address
export const updateAddress = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { title, address, latitude, longitude, is_default } = req.body;

        // If this is set as default, remove default from other addresses of the same user
        if (is_default) {
            // First get the user_id of this address
            const [addressRows] = await db.execute<RowDataPacket[]>("SELECT user_id FROM addresses WHERE id = ?", [id]);

            if (addressRows.length > 0) {
                await db.execute("UPDATE addresses SET is_default = FALSE WHERE user_id = ? AND id != ?", [
                    addressRows[0].user_id,
                    id,
                ]);
            }
        }

        const query = `
            UPDATE addresses 
            SET title = ?, address = ?, latitude = ?, longitude = ?, is_default = ?, updated_at = NOW()
            WHERE id = ?
        `;

        const values = [title, address, latitude || null, longitude || null, is_default || false, id];

        const [result] = await db.execute<ResultSetHeader>(query, values);

        if (result.affectedRows === 0) {
            res.status(404).json({
                success: false,
                message: "Address not found",
            });
            return;
        }

        res.status(200).json({
            success: true,
            message: "Address updated successfully",
        });
    } catch (error) {
        console.error("Error updating address:", error);
        res.status(500).json({
            success: false,
            message: "Failed to update address",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};

// Delete address
export const deleteAddress = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const query = "DELETE FROM addresses WHERE id = ?";
        const [result] = await db.execute<ResultSetHeader>(query, [id]);

        if (result.affectedRows === 0) {
            res.status(404).json({
                success: false,
                message: "Address not found",
            });
            return;
        }

        res.status(200).json({
            success: true,
            message: "Address deleted successfully",
        });
    } catch (error) {
        console.error("Error deleting address:", error);
        res.status(500).json({
            success: false,
            message: "Failed to delete address",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};

// Set address as default
export const setDefaultAddress = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        // First get the user_id of this address
        const [addressRows] = await db.execute<RowDataPacket[]>("SELECT user_id FROM addresses WHERE id = ?", [id]);

        if (addressRows.length === 0) {
            res.status(404).json({
                success: false,
                message: "Address not found",
            });
            return;
        }

        const user_id = addressRows[0].user_id;

        // Remove default from all user's addresses
        await db.execute("UPDATE addresses SET is_default = FALSE WHERE user_id = ?", [user_id]);

        // Set this address as default
        await db.execute("UPDATE addresses SET is_default = TRUE, updated_at = NOW() WHERE id = ?", [id]);

        res.status(200).json({
            success: true,
            message: "Default address updated successfully",
        });
    } catch (error) {
        console.error("Error setting default address:", error);
        res.status(500).json({
            success: false,
            message: "Failed to set default address",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};
