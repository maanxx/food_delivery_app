"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setDefaultAddress = exports.deleteAddress = exports.updateAddress = exports.addAddress = exports.getUserAddresses = void 0;
const db_1 = __importDefault(require("../database/db"));
// Get all addresses for a user
const getUserAddresses = async (req, res) => {
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
        const [rows] = await db_1.default.execute(query, [userId]);
        res.status(200).json({
            success: true,
            message: "Addresses retrieved successfully",
            addresses: rows,
        });
    }
    catch (error) {
        console.error("Error getting user addresses:", error);
        res.status(500).json({
            success: false,
            message: "Failed to get addresses",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};
exports.getUserAddresses = getUserAddresses;
// Add new address
const addAddress = async (req, res) => {
    try {
        const { user_id, title, address, latitude, longitude, is_default } = req.body;
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
            await db_1.default.execute("UPDATE addresses SET is_default = FALSE WHERE user_id = ?", [user_id]);
        }
        const addressId = `addr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const query = `
            INSERT INTO addresses (id, user_id, title, address, latitude, longitude, is_default, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        `;
        const values = [addressId, user_id, title, address, latitude || null, longitude || null, is_default || false];
        await db_1.default.execute(query, values);
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
    }
    catch (error) {
        console.error("Error adding address:", error);
        res.status(500).json({
            success: false,
            message: "Failed to add address",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};
exports.addAddress = addAddress;
// Update address
const updateAddress = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, address, latitude, longitude, is_default } = req.body;
        // If this is set as default, remove default from other addresses of the same user
        if (is_default) {
            // First get the user_id of this address
            const [addressRows] = await db_1.default.execute("SELECT user_id FROM addresses WHERE id = ?", [id]);
            if (addressRows.length > 0) {
                await db_1.default.execute("UPDATE addresses SET is_default = FALSE WHERE user_id = ? AND id != ?", [
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
        const [result] = await db_1.default.execute(query, values);
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
    }
    catch (error) {
        console.error("Error updating address:", error);
        res.status(500).json({
            success: false,
            message: "Failed to update address",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};
exports.updateAddress = updateAddress;
// Delete address
const deleteAddress = async (req, res) => {
    try {
        const { id } = req.params;
        const query = "DELETE FROM addresses WHERE id = ?";
        const [result] = await db_1.default.execute(query, [id]);
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
    }
    catch (error) {
        console.error("Error deleting address:", error);
        res.status(500).json({
            success: false,
            message: "Failed to delete address",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};
exports.deleteAddress = deleteAddress;
// Set address as default
const setDefaultAddress = async (req, res) => {
    try {
        const { id } = req.params;
        // First get the user_id of this address
        const [addressRows] = await db_1.default.execute("SELECT user_id FROM addresses WHERE id = ?", [id]);
        if (addressRows.length === 0) {
            res.status(404).json({
                success: false,
                message: "Address not found",
            });
            return;
        }
        const user_id = addressRows[0].user_id;
        // Remove default from all user's addresses
        await db_1.default.execute("UPDATE addresses SET is_default = FALSE WHERE user_id = ?", [user_id]);
        // Set this address as default
        await db_1.default.execute("UPDATE addresses SET is_default = TRUE, updated_at = NOW() WHERE id = ?", [id]);
        res.status(200).json({
            success: true,
            message: "Default address updated successfully",
        });
    }
    catch (error) {
        console.error("Error setting default address:", error);
        res.status(500).json({
            success: false,
            message: "Failed to set default address",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};
exports.setDefaultAddress = setDefaultAddress;
