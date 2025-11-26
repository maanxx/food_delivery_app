"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResponseUtils = void 0;
class ResponseUtils {
    // Success response
    static success(res, message = "Success", data, statusCode = 200) {
        const response = {
            success: true,
            message,
            data,
            meta: {
                timestamp: new Date().toISOString(),
            },
        };
        return res.status(statusCode).json(response);
    }
    // Error response
    static error(res, message = "Internal Server Error", errors, statusCode = 500, data) {
        const response = {
            success: false,
            message,
            errors,
            data,
            meta: {
                timestamp: new Date().toISOString(),
            },
        };
        return res.status(statusCode).json(response);
    }
    // Validation error response
    static validationError(res, errors, message = "Validation failed") {
        return this.error(res, message, errors, 400);
    }
    // Unauthorized response
    static unauthorized(res, message = "Unauthorized access") {
        return this.error(res, message, undefined, 401);
    }
    // Forbidden response
    static forbidden(res, message = "Access forbidden") {
        return this.error(res, message, undefined, 403);
    }
    // Not found response
    static notFound(res, message = "Resource not found") {
        return this.error(res, message, undefined, 404);
    }
    // Conflict response
    static conflict(res, message = "Conflict occurred") {
        return this.error(res, message, undefined, 409);
    }
    // Too many requests response
    static tooManyRequests(res, message = "Too many requests") {
        return this.error(res, message, undefined, 429);
    }
}
exports.ResponseUtils = ResponseUtils;
exports.default = ResponseUtils;
