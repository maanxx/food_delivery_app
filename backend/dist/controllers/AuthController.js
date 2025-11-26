"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const User_1 = require("../models/User");
const jwt_1 = require("../utils/jwt");
const response_1 = __importDefault(require("../utils/response"));
const google_auth_library_1 = require("google-auth-library"); // <-- added
class AuthController {
    // Register new user
    static async register(req, res) {
        try {
            const { fullname, email, phone_number, password, country_code } = req.body;
            // Check if email already exists
            const existingEmailUser = await User_1.UserModel.findByEmail(email);
            if (existingEmailUser) {
                response_1.default.conflict(res, "Email đã được sử dụng");
                return;
            }
            // Check if phone already exists
            const existingPhoneUser = await User_1.UserModel.findByPhone(phone_number);
            if (existingPhoneUser) {
                response_1.default.conflict(res, "Số điện thoại đã được sử dụng");
                return;
            }
            // Create new user
            const userId = await User_1.UserModel.create({
                fullname,
                email,
                phone_number,
                password,
                country_code: country_code || "+84",
                type_login: "Standard",
                role: "Customer",
            });
            // Get created user
            const newUser = await User_1.UserModel.findById(userId);
            if (!newUser) {
                response_1.default.error(res, "Lỗi tạo tài khoản");
                return;
            }
            // Generate tokens
            const tokenPayload = {
                userId: newUser.user_id,
                email: newUser.email,
                role: newUser.role,
            };
            const tokens = jwt_1.JWTUtils.generateTokenPair(tokenPayload);
            // Update last login
            await User_1.UserModel.updateLastLogin(userId);
            // Remove password from response
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { password: _, ...userWithoutPassword } = newUser;
            response_1.default.success(res, "Đăng ký thành công", {
                user: userWithoutPassword,
                tokens,
            }, 201);
        }
        catch (error) {
            console.error("Register error:", error);
            response_1.default.error(res, "Lỗi server khi đăng ký");
        }
    }
    // Login user
    static async login(req, res) {
        try {
            const { email, password } = req.body;
            console.log("Email :" + email + "Password: " + password);
            // Find user by email
            const user = await User_1.UserModel.findByEmail(email);
            if (!user) {
                response_1.default.unauthorized(res, "Email hoặc mật khẩu không đúng");
                return;
            }
            // Verify password
            const isPasswordValid = await User_1.UserModel.verifyPassword(password, user.password);
            if (!isPasswordValid) {
                response_1.default.unauthorized(res, "Email hoặc mật khẩu không đúng");
                return;
            }
            // Generate tokens
            const tokenPayload = {
                userId: user.user_id,
                email: user.email,
                role: user.role,
            };
            const tokens = jwt_1.JWTUtils.generateTokenPair(tokenPayload);
            // Update last login
            await User_1.UserModel.updateLastLogin(user.user_id);
            // Remove password from response
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { password: _, ...userWithoutPassword } = user;
            response_1.default.success(res, "Đăng nhập thành công", {
                user: userWithoutPassword,
                tokens,
            });
        }
        catch (error) {
            console.error("Login error:", error);
            response_1.default.error(res, "Lỗi server khi đăng nhập");
        }
    }
    // Refresh token
    static async refreshToken(req, res) {
        try {
            const { refreshToken } = req.body;
            // Verify refresh token
            const payload = jwt_1.JWTUtils.verifyRefreshToken(refreshToken);
            // Check if user still exists
            const user = await User_1.UserModel.findById(payload.userId);
            if (!user) {
                response_1.default.unauthorized(res, "User không tồn tại");
                return;
            }
            // Generate new tokens
            const tokenPayload = {
                userId: user.user_id,
                email: user.email,
                role: user.role,
            };
            const tokens = jwt_1.JWTUtils.generateTokenPair(tokenPayload);
            response_1.default.success(res, "Token đã được làm mới", { tokens });
        }
        catch (error) {
            console.error("Refresh token error:", error);
            response_1.default.unauthorized(res, "Refresh token không hợp lệ");
        }
    }
    // Get current user profile
    static async getProfile(req, res) {
        try {
            if (!req.userId) {
                response_1.default.unauthorized(res, "User không được xác thực");
                return;
            }
            const user = await User_1.UserModel.findById(req.userId);
            if (!user) {
                response_1.default.notFound(res, "User không tồn tại");
                return;
            }
            // Remove password from response
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { password: _, ...userWithoutPassword } = user;
            response_1.default.success(res, "Lấy thông tin profile thành công", {
                user: userWithoutPassword,
            });
        }
        catch (error) {
            console.error("Get profile error:", error);
            response_1.default.error(res, "Lỗi server khi lấy thông tin profile");
        }
    }
    // Update user profile
    static async updateProfile(req, res) {
        try {
            console.log("req.userId: ", req.userId);
            if (!req.userId) {
                response_1.default.unauthorized(res, "User không được xác thực");
                return;
            }
            const { fullname, address, gender, date_of_birth, phone_number, avatar_path } = req.body;
            // Chuyển đổi date_of_birth về yyyy-MM-dd nếu có
            let formattedDob = date_of_birth;
            if (date_of_birth) {
                try {
                    const d = new Date(date_of_birth);
                    if (!isNaN(d.getTime())) {
                        formattedDob = d.toISOString().slice(0, 10);
                    }
                }
                catch (e) {
                    // Nếu lỗi, giữ nguyên giá trị cũ
                }
            }
            // Check if phone number is being changed and already exists
            if (phone_number) {
                const existingPhoneUser = await User_1.UserModel.findByPhone(phone_number);
                if (existingPhoneUser && existingPhoneUser.user_id !== req.userId) {
                    response_1.default.conflict(res, "Số điện thoại đã được sử dụng");
                    return;
                }
            }
            // Update user
            const updateData = {};
            if (fullname !== undefined)
                updateData.fullname = fullname;
            // if (address !== undefined) updateData.address = address;
            if (gender !== undefined)
                updateData.gender = gender;
            if (date_of_birth !== undefined)
                updateData.date_of_birth = formattedDob;
            if (phone_number !== undefined)
                updateData.phone_number = phone_number;
            if (avatar_path !== undefined)
                updateData.avatar_path = avatar_path;
            const updated = await User_1.UserModel.update(req.userId, updateData);
            if (!updated) {
                response_1.default.error(res, "Cập nhật profile thất bại");
                return;
            }
            // Get updated user
            const updatedUser = await User_1.UserModel.findById(req.userId);
            if (!updatedUser) {
                response_1.default.error(res, "Lỗi lấy thông tin user sau khi cập nhật");
                return;
            }
            // Remove password from response
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { password: _, ...userWithoutPassword } = updatedUser;
            response_1.default.success(res, "Cập nhật profile thành công", {
                user: userWithoutPassword,
            });
        }
        catch (error) {
            console.error("Update profile error:", error);
            response_1.default.error(res, "Lỗi server khi cập nhật profile");
        }
    } // Change password
    static async changePassword(req, res) {
        try {
            if (!req.userId) {
                response_1.default.unauthorized(res, "User không được xác thực");
                return;
            }
            const { currentPassword, newPassword } = req.body;
            // Get current user
            const user = await User_1.UserModel.findById(req.userId);
            if (!user) {
                response_1.default.notFound(res, "User không tồn tại");
                return;
            }
            // Verify current password
            const isCurrentPasswordValid = await User_1.UserModel.verifyPassword(currentPassword, user.password);
            if (!isCurrentPasswordValid) {
                response_1.default.unauthorized(res, "Mật khẩu hiện tại không đúng");
                return;
            }
            // Update password
            const updated = await User_1.UserModel.update(req.userId, { password: newPassword });
            if (!updated) {
                response_1.default.error(res, "Đổi mật khẩu thất bại");
                return;
            }
            response_1.default.success(res, "Đổi mật khẩu thành công");
        }
        catch (error) {
            console.error("Change password error:", error);
            response_1.default.error(res, "Lỗi server khi đổi mật khẩu");
        }
    }
    // Logout (set user offline)
    static async logout(req, res) {
        try {
            if (req.userId) {
                await User_1.UserModel.setOffline(req.userId);
            }
            response_1.default.success(res, "Đăng xuất thành công");
        }
        catch (error) {
            console.error("Logout error:", error);
            response_1.default.error(res, "Lỗi server khi đăng xuất");
        }
    }
    // Forgot password (placeholder - would send email in real implementation)
    static async forgotPassword(req, res) {
        try {
            const { email } = req.body;
            // Check if user exists
            const user = await User_1.UserModel.findByEmail(email);
            if (!user) {
                // Don't reveal if email exists or not for security
                response_1.default.success(res, "Nếu email tồn tại, bạn sẽ nhận được hướng dẫn khôi phục mật khẩu");
                return;
            }
            // TODO: In real implementation, generate reset token and send email
            // For now, just return success message
            response_1.default.success(res, "Email khôi phục mật khẩu đã được gửi (chức năng này đang phát triển)");
        }
        catch (error) {
            console.error("Forgot password error:", error);
            response_1.default.error(res, "Lỗi server khi xử lý yêu cầu quên mật khẩu");
        }
    }
    // Sign in / register with Google idToken
    static async googleSignIn(req, res) {
        try {
            const { idToken } = req.body;
            if (!idToken) {
                response_1.default.badRequest(res, "Missing idToken");
                return;
            }
            const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
            if (!GOOGLE_CLIENT_ID) {
                console.error("Missing GOOGLE_CLIENT_ID env");
                response_1.default.error(res, "Server config error");
                return;
            }
            const client = new google_auth_library_1.OAuth2Client(GOOGLE_CLIENT_ID);
            const ticket = await client.verifyIdToken({
                idToken,
                audience: GOOGLE_CLIENT_ID,
            });
            const payload = ticket.getPayload();
            if (!payload) {
                response_1.default.unauthorized(res, "Invalid Google idToken");
                return;
            }
            const googleId = payload.sub;
            const email = payload.email || "";
            const fullname = payload.name || "";
            const picture = payload.picture || "";
            // Find existing user by email
            let user = await User_1.UserModel.findByEmail(email);
            if (user) {
                // Update user to mark google login (optional fields)
                await User_1.UserModel.update(user.user_id, {
                    fullname,
                    avatar: picture,
                    type_login: "Google",
                    google_id: googleId,
                });
            }
            else {
                // Create new user (password empty, type_login Google)
                const newUserId = await User_1.UserModel.create({
                    fullname,
                    email,
                    phone_number: null,
                    password: "", // no password for social account
                    country_code: "+84",
                    type_login: "Google",
                    role: "Customer",
                    google_id: googleId,
                    avatar: picture,
                });
                user = await User_1.UserModel.findById(newUserId);
            }
            if (!user) {
                response_1.default.error(res, "Không thể tạo hoặc lấy thông tin user");
                return;
            }
            // Generate tokens
            const tokenPayload = {
                userId: user.user_id,
                email: user.email,
                role: user.role,
            };
            const tokens = jwt_1.JWTUtils.generateTokenPair(tokenPayload);
            // Update last login
            await User_1.UserModel.updateLastLogin(user.user_id);
            // Remove password from response
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { password: _, ...userWithoutPassword } = user;
            response_1.default.success(res, "Đăng nhập bằng Google thành công", {
                user: userWithoutPassword,
                tokens,
            });
        }
        catch (error) {
            console.error("Google sign-in error:", error);
            response_1.default.unauthorized(res, "Google idToken không hợp lệ hoặc lỗi server");
        }
    }
}
exports.AuthController = AuthController;
exports.default = AuthController;
