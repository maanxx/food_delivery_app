import { Router } from "express";
import AuthController from "../controllers/AuthController";
import AuthMiddleware from "../middlewares/auth";
import ValidationRules, { ValidationMiddleware } from "../utils/validation";

const router = Router();

// Public routes
router.post(
    "/register",
    ValidationRules.register,
    ValidationMiddleware.handleValidationErrors,
    AuthController.register,
);

router.post("/login", ValidationRules.login, ValidationMiddleware.handleValidationErrors, AuthController.login);

router.post(
    "/refresh-token",
    ValidationRules.refreshToken,
    ValidationMiddleware.handleValidationErrors,
    AuthController.refreshToken,
);

router.post(
    "/forgot-password",
    ValidationRules.forgotPassword,
    ValidationMiddleware.handleValidationErrors,
    AuthController.forgotPassword,
);

// Protected routes (require authentication)
router.get("/profile", AuthMiddleware.authenticate, AuthController.getProfile);

router.put(
    "/profile",
    AuthMiddleware.authenticate,
    ValidationRules.updateProfile,
    ValidationMiddleware.handleValidationErrors,
    AuthController.updateProfile,
);

router.post(
    "/change-password",
    AuthMiddleware.authenticate,
    ValidationRules.changePassword,
    ValidationMiddleware.handleValidationErrors,
    AuthController.changePassword,
);

router.post("/logout", AuthMiddleware.authenticate, AuthController.logout);

export default router;
