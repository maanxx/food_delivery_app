import { Response } from "express";

export interface ApiResponse<T = unknown> {
    success: boolean;
    message: string;
    data?: T;
    errors?: string[];
    meta?: {
        timestamp: string;
        path?: string;
        method?: string;
    };
}

export class ResponseUtils {
    // Success response
    static success<T>(
        res: Response,
        message: string = "Success",
        data?: T,
        statusCode: number = 200,
    ): Response<ApiResponse<T>> {
        const response: ApiResponse<T> = {
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
    static error(
        res: Response,
        message: string = "Internal Server Error",
        errors?: string[],
        statusCode: number = 500,
        data?: unknown,
    ): Response<ApiResponse> {
        const response: ApiResponse = {
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
    static validationError(
        res: Response,
        errors: string[],
        message: string = "Validation failed",
    ): Response<ApiResponse> {
        return this.error(res, message, errors, 400);
    }

    // Unauthorized response
    static unauthorized(res: Response, message: string = "Unauthorized access"): Response<ApiResponse> {
        return this.error(res, message, undefined, 401);
    }

    // Forbidden response
    static forbidden(res: Response, message: string = "Access forbidden"): Response<ApiResponse> {
        return this.error(res, message, undefined, 403);
    }

    // Not found response
    static notFound(res: Response, message: string = "Resource not found"): Response<ApiResponse> {
        return this.error(res, message, undefined, 404);
    }

    // Conflict response
    static conflict(res: Response, message: string = "Conflict occurred"): Response<ApiResponse> {
        return this.error(res, message, undefined, 409);
    }

    // Too many requests response
    static tooManyRequests(res: Response, message: string = "Too many requests"): Response<ApiResponse> {
        return this.error(res, message, undefined, 429);
    }
}

export default ResponseUtils;
