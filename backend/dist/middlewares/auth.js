"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.customerMiddleware = exports.adminMiddleware = exports.optionalAuthMiddleware = exports.authMiddleware = exports.AuthMiddleware = void 0;
const jwt_1 = require("../utils/jwt");
const User_1 = require("../models/User");
const response_1 = __importDefault(require("../utils/response"));
class AuthMiddleware {
    // Verify JWT token
    static async authenticate(req, res, next) {
        try {
            const authHeader = req.headers.authorization;
            const token = jwt_1.JWTUtils.extractTokenFromHeader(authHeader);
            if (!token) {
                response_1.default.unauthorized(res, "Access token is required");
                return;
            }
            // Verify token
            const payload = jwt_1.JWTUtils.verifyAccessToken(token);
            // Check if user still exists
            const user = await User_1.UserModel.findById(payload.userId);
            if (!user) {
                response_1.default.unauthorized(res, "User not found");
                return;
            }
            // Add user info to request
            req.user = payload;
            req.userId = payload.userId;
            next();
        }
        catch (error) {
            const message = error instanceof Error ? error.message : "Authentication failed";
            response_1.default.unauthorized(res, message);
        }
    }
    // Optional authentication (for routes that work with/without auth)
    static async optionalAuth(req, res, next) {
        try {
            const authHeader = req.headers.authorization;
            const token = jwt_1.JWTUtils.extractTokenFromHeader(authHeader);
            if (token) {
                try {
                    const payload = jwt_1.JWTUtils.verifyAccessToken(token);
                    const user = await User_1.UserModel.findById(payload.userId);
                    if (user) {
                        req.user = payload;
                        req.userId = payload.userId;
                    }
                }
                catch {
                    // Token invalid but continue without auth
                }
            }
            next();
        }
        catch {
            // Continue without auth if any error occurs
            next();
        }
    }
    // Check user role
    static authorize(roles) {
        return (req, res, next) => {
            if (!req.user) {
                response_1.default.unauthorized(res, "Authentication required");
                return;
            }
            if (!roles.includes(req.user.role)) {
                response_1.default.forbidden(res, "Insufficient permissions");
                return;
            }
            next();
        };
    }
    // Check if user is admin
    static adminOnly(req, res, next) {
        if (!req.user) {
            response_1.default.unauthorized(res, "Authentication required");
            return;
        }
        if (req.user.role !== "Admin") {
            response_1.default.forbidden(res, "Admin access only");
            return;
        }
        next();
    }
    // Check if user is customer
    static customerOnly(req, res, next) {
        if (!req.user) {
            response_1.default.unauthorized(res, "Authentication required");
            return;
        }
        if (req.user.role !== "Customer") {
            response_1.default.forbidden(res, "Customer access only");
            return;
        }
        next();
    }
    // Check if user owns resource or is admin
    static ownerOrAdmin(req, res, next) {
        if (!req.user) {
            response_1.default.unauthorized(res, "Authentication required");
            return;
        }
        const resourceUserId = req.params.userId || req.body.userId || req.query.userId;
        if (req.user.role === "Admin" || req.user.userId === resourceUserId) {
            next();
            return;
        }
        response_1.default.forbidden(res, "Access denied");
    }
}
exports.AuthMiddleware = AuthMiddleware;
// Export both class and shorthand function
exports.default = AuthMiddleware;
exports.authMiddleware = AuthMiddleware.authenticate.bind(AuthMiddleware);
exports.optionalAuthMiddleware = AuthMiddleware.optionalAuth.bind(AuthMiddleware);
exports.adminMiddleware = AuthMiddleware.adminOnly.bind(AuthMiddleware);
exports.customerMiddleware = AuthMiddleware.customerOnly.bind(AuthMiddleware);
