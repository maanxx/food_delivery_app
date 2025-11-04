import { body, validationResult } from "express-validator";
import { Request, Response, NextFunction } from "express";
import ResponseUtils from "../utils/response";

export class ValidationRules {
    // Login validation
    static login = [
        body("email").isEmail().normalizeEmail().withMessage("Email không hợp lệ"),
        body("password").isLength({ min: 6 }).withMessage("Mật khẩu phải có ít nhất 6 ký tự"),
    ];

    // Register validation
    static register = [
        body("fullname").trim().isLength({ min: 2, max: 100 }).withMessage("Họ tên phải có từ 2-100 ký tự"),
        body("email").isEmail().normalizeEmail().withMessage("Email không hợp lệ"),
        body("phone_number")
            .matches(/^[0-9]{10,11}$/)
            .withMessage("Số điện thoại phải có 10-11 chữ số"),
        body("password")
            .isLength({ min: 6, max: 50 })
            .withMessage("Mật khẩu phải có từ 6-50 ký tự")
            .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
            .withMessage("Mật khẩu phải chứa ít nhất 1 chữ thường, 1 chữ hoa và 1 số"),
        body("country_code")
            .optional()
            .matches(/^\+\d{1,4}$/)
            .withMessage("Mã quốc gia không hợp lệ"),
    ];

    // Forgot password validation
    static forgotPassword = [body("email").isEmail().normalizeEmail().withMessage("Email không hợp lệ")];

    // Reset password validation
    static resetPassword = [
        body("password")
            .isLength({ min: 6, max: 50 })
            .withMessage("Mật khẩu phải có từ 6-50 ký tự")
            .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
            .withMessage("Mật khẩu phải chứa ít nhất 1 chữ thường, 1 chữ hoa và 1 số"),
        body("confirmPassword").custom((value, { req }) => {
            if (value !== req.body.password) {
                throw new Error("Mật khẩu xác nhận không khớp");
            }
            return true;
        }),
    ];

    // Change password validation
    static changePassword = [
        body("currentPassword").notEmpty().withMessage("Mật khẩu hiện tại là bắt buộc"),
        body("newPassword")
            .isLength({ min: 6, max: 50 })
            .withMessage("Mật khẩu mới phải có từ 6-50 ký tự")
            .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
            .withMessage("Mật khẩu mới phải chứa ít nhất 1 chữ thường, 1 chữ hoa và 1 số"),
        body("confirmPassword").custom((value, { req }) => {
            if (value !== req.body.newPassword) {
                throw new Error("Mật khẩu xác nhận không khớp");
            }
            return true;
        }),
    ];

    // Update profile validation
    static updateProfile = [
        body("fullname").optional().trim().isLength({ min: 2, max: 100 }).withMessage("Họ tên phải có từ 2-100 ký tự"),
        body("address").optional().trim().isLength({ max: 255 }).withMessage("Địa chỉ không được quá 255 ký tự"),
        body("gender").optional().isIn(["Male", "Female", "Other"]).withMessage("Giới tính không hợp lệ"),
        body("date_of_birth").optional().isISO8601().withMessage("Ngày sinh không hợp lệ"),
        body("phone_number")
            .optional()
            .matches(/^[0-9]{10,11}$/)
            .withMessage("Số điện thoại phải có 10-11 chữ số"),
    ];

    // Refresh token validation
    static refreshToken = [body("refreshToken").notEmpty().withMessage("Refresh token là bắt buộc")];
}

export class ValidationMiddleware {
    // Handle validation errors
    static handleValidationErrors = (req: Request, res: Response, next: NextFunction): void => {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            const errorMessages = errors.array().map((error) => error.msg);
            ResponseUtils.validationError(res, errorMessages);
            return;
        }

        next();
    };
}

export default ValidationRules;
