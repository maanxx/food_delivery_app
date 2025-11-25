import { Router } from "express";
import {
    getUserAddresses,
    addAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
} from "../controllers/AddressController";

const router = Router();

// GET /api/addresses/user/:userId - Get all addresses for a user
router.get("/addresses/user/:userId", getUserAddresses);

// POST /api/addresses - Add new address
router.post("/addresses", addAddress);

// PUT /api/addresses/:id - Update address
router.put("/addresses/:id", updateAddress);

// DELETE /api/addresses/:id - Delete address
router.delete("/addresses/:id", deleteAddress);

// PUT /api/addresses/:id/default - Set address as default
router.put("/addresses/:id/default", setDefaultAddress);

export default router;
