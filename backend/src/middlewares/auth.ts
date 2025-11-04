import { Request, Response, NextFunction } from "express";
import { JWTUtils, TokenPayload } from "../utils/jwt";
import { UserModel } from "../models/User";
import ResponseUtils from "../utils/response";

interface UserRequest extends Request {
    user?: TokenPayload;
    userId?: string;
}

export class AuthMiddleware {
    // Verify JWT token
    static async authenticate(req: UserRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const authHeader = req.headers.authorization;
            const token = JWTUtils.extractTokenFromHeader(authHeader);

            if (!token) {
                ResponseUtils.unauthorized(res, "Access token is required");
                return;
            }

            // Verify token
            const payload = JWTUtils.verifyAccessToken(token);

            // Check if user still exists
            const user = await UserModel.findById(payload.userId);
            if (!user) {
                ResponseUtils.unauthorized(res, "User not found");
                return;
            }

            // Add user info to request
            req.user = payload;
            req.userId = payload.userId;

            next();
        } catch (error) {
            const message = error instanceof Error ? error.message : "Authentication failed";
            ResponseUtils.unauthorized(res, message);
        }
    }

    // Optional authentication (for routes that work with/without auth)
    static async optionalAuth(req: UserRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const authHeader = req.headers.authorization;
            const token = JWTUtils.extractTokenFromHeader(authHeader);

            if (token) {
                try {
                    const payload = JWTUtils.verifyAccessToken(token);
                    const user = await UserModel.findById(payload.userId);

                    if (user) {
                        req.user = payload;
                        req.userId = payload.userId;
                    }
                } catch {
                    // Token invalid but continue without auth
                }
            }

            next();
        } catch {
            // Continue without auth if any error occurs
            next();
        }
    }

    // Check user role
    static authorize(roles: string[]) {
        return (req: UserRequest, res: Response, next: NextFunction): void => {
            if (!req.user) {
                ResponseUtils.unauthorized(res, "Authentication required");
                return;
            }

            if (!roles.includes(req.user.role)) {
                ResponseUtils.forbidden(res, "Insufficient permissions");
                return;
            }

            next();
        };
    }

    // Check if user is admin
    static adminOnly(req: UserRequest, res: Response, next: NextFunction): void {
        if (!req.user) {
            ResponseUtils.unauthorized(res, "Authentication required");
            return;
        }

        if (req.user.role !== "Admin") {
            ResponseUtils.forbidden(res, "Admin access only");
            return;
        }

        next();
    }

    // Check if user is customer
    static customerOnly(req: UserRequest, res: Response, next: NextFunction): void {
        if (!req.user) {
            ResponseUtils.unauthorized(res, "Authentication required");
            return;
        }

        if (req.user.role !== "Customer") {
            ResponseUtils.forbidden(res, "Customer access only");
            return;
        }

        next();
    }

    // Check if user owns resource or is admin
    static ownerOrAdmin(req: UserRequest, res: Response, next: NextFunction): void {
        if (!req.user) {
            ResponseUtils.unauthorized(res, "Authentication required");
            return;
        }

        const resourceUserId = req.params.userId || req.body.userId || req.query.userId;

        if (req.user.role === "Admin" || req.user.userId === resourceUserId) {
            next();
            return;
        }

        ResponseUtils.forbidden(res, "Access denied");
    }
}

export default AuthMiddleware;
