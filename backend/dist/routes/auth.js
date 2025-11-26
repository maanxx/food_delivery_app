"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const AuthController_1 = __importDefault(require("../controllers/AuthController"));
const auth_1 = __importDefault(require("../middlewares/auth"));
const validation_1 = __importStar(require("../utils/validation"));
const router = (0, express_1.Router)();
// Public routes
router.post("/register", validation_1.default.register, validation_1.ValidationMiddleware.handleValidationErrors, AuthController_1.default.register);
router.post("/login", validation_1.default.login, validation_1.ValidationMiddleware.handleValidationErrors, AuthController_1.default.login);
router.post("/refresh-token", validation_1.default.refreshToken, validation_1.ValidationMiddleware.handleValidationErrors, AuthController_1.default.refreshToken);
router.post("/forgot-password", validation_1.default.forgotPassword, validation_1.ValidationMiddleware.handleValidationErrors, AuthController_1.default.forgotPassword);
router.post("/google-signin", AuthController_1.default.googleSignIn);
// Protected routes (require authentication)
router.get("/profile", auth_1.default.authenticate, AuthController_1.default.getProfile);
router.put("/profile", auth_1.default.authenticate, AuthController_1.default.updateProfile);
router.post("/change-password", auth_1.default.authenticate, validation_1.default.changePassword, AuthController_1.default.changePassword);
router.post("/logout", auth_1.default.authenticate, AuthController_1.default.logout);
exports.default = router;
