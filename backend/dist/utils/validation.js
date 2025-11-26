"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidationMiddleware = exports.ValidationRules = void 0;
const express_validator_1 = require("express-validator");
const response_1 = __importDefault(require("../utils/response"));
class ValidationRules {
}
exports.ValidationRules = ValidationRules;
// Login validation
ValidationRules.login = [
    (0, express_validator_1.body)("email").isEmail().normalizeEmail().withMessage("Email không hợp lệ"),
    (0, express_validator_1.body)("password").isLength({ min: 6 }).withMessage("Mật khẩu phải có ít nhất 6 ký tự"),
];
// Register validation
ValidationRules.register = [
    (0, express_validator_1.body)("fullname").trim().isLength({ min: 2, max: 100 }).withMessage("Họ tên phải có từ 2-100 ký tự"),
    (0, express_validator_1.body)("email").isEmail().normalizeEmail().withMessage("Email không hợp lệ"),
    (0, express_validator_1.body)("phone_number")
        .matches(/^[0-9]{10,11}$/)
        .withMessage("Số điện thoại phải có 10-11 chữ số"),
    (0, express_validator_1.body)("password")
        .isLength({ min: 6, max: 50 })
        .withMessage("Mật khẩu phải có từ 6-50 ký tự")
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage("Mật khẩu phải chứa ít nhất 1 chữ thường, 1 chữ hoa và 1 số"),
    (0, express_validator_1.body)("country_code")
        .optional()
        .matches(/^\+\d{1,4}$/)
        .withMessage("Mã quốc gia không hợp lệ"),
];
// Forgot password validation
ValidationRules.forgotPassword = [(0, express_validator_1.body)("email").isEmail().normalizeEmail().withMessage("Email không hợp lệ")];
// Reset password validation
ValidationRules.resetPassword = [
    (0, express_validator_1.body)("password")
        .isLength({ min: 6, max: 50 })
        .withMessage("Mật khẩu phải có từ 6-50 ký tự")
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage("Mật khẩu phải chứa ít nhất 1 chữ thường, 1 chữ hoa và 1 số"),
    (0, express_validator_1.body)("confirmPassword").custom((value, { req }) => {
        if (value !== req.body.password) {
            throw new Error("Mật khẩu xác nhận không khớp");
        }
        return true;
    }),
];
// Change password validation
ValidationRules.changePassword = [
    (0, express_validator_1.body)("currentPassword").notEmpty().withMessage("Mật khẩu hiện tại là bắt buộc"),
    (0, express_validator_1.body)("newPassword")
        .isLength({ min: 6, max: 50 })
        .withMessage("Mật khẩu mới phải có từ 6-50 ký tự")
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage("Mật khẩu mới phải chứa ít nhất 1 chữ thường, 1 chữ hoa và 1 số"),
    (0, express_validator_1.body)("confirmPassword").custom((value, { req }) => {
        if (value !== req.body.newPassword) {
            throw new Error("Mật khẩu xác nhận không khớp");
        }
        return true;
    }),
];
// Update profile validation
ValidationRules.updateProfile = [
    (0, express_validator_1.body)("fullname").optional().trim().isLength({ min: 2, max: 100 }).withMessage("Họ tên phải có từ 2-100 ký tự"),
    (0, express_validator_1.body)("address").optional().trim().isLength({ max: 255 }).withMessage("Địa chỉ không được quá 255 ký tự"),
    (0, express_validator_1.body)("gender").optional().isIn(["Male", "Female", "Other"]).withMessage("Giới tính không hợp lệ"),
    (0, express_validator_1.body)("date_of_birth").optional().isISO8601().withMessage("Ngày sinh không hợp lệ"),
    (0, express_validator_1.body)("phone_number")
        .optional()
        .matches(/^[0-9]{10,11}$/)
        .withMessage("Số điện thoại phải có 10-11 chữ số"),
];
// Refresh token validation
ValidationRules.refreshToken = [(0, express_validator_1.body)("refreshToken").notEmpty().withMessage("Refresh token là bắt buộc")];
class ValidationMiddleware {
}
exports.ValidationMiddleware = ValidationMiddleware;
// Handle validation errors
ValidationMiddleware.handleValidationErrors = (req, res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        const errorMessages = errors.array().map((error) => error.msg);
        response_1.default.validationError(res, errorMessages);
        return;
    }
    next();
};
exports.default = ValidationRules;
