"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const AddressController_1 = require("../controllers/AddressController");
const router = (0, express_1.Router)();
// GET /api/addresses/user/:userId - Get all addresses for a user
router.get("/addresses/user/:userId", AddressController_1.getUserAddresses);
// POST /api/addresses - Add new address
router.post("/addresses", AddressController_1.addAddress);
// PUT /api/addresses/:id - Update address
router.put("/addresses/:id", AddressController_1.updateAddress);
// DELETE /api/addresses/:id - Delete address
router.delete("/addresses/:id", AddressController_1.deleteAddress);
// PUT /api/addresses/:id/default - Set address as default
router.put("/addresses/:id/default", AddressController_1.setDefaultAddress);
exports.default = router;
