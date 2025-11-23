import { Request, Response } from "express";
import { UserModel } from "../models/User";
import { JWTUtils, TokenPayload } from "../utils/jwt";
import ResponseUtils from "../utils/response";
import { OAuth2Client } from "google-auth-library"; // <-- added

interface UserRequest extends Request {
    user?: TokenPayload;
    userId?: string;
}

export class AuthController {
    // Register new user
    static async register(req: Request, res: Response): Promise<void> {
        try {
            const { fullname, email, phone_number, password, country_code } = req.body;

            // Check if email already exists
            const existingEmailUser = await UserModel.findByEmail(email);
            if (existingEmailUser) {
                ResponseUtils.conflict(res, "Email đã được sử dụng");
                return;
            }

            // Check if phone already exists
            const existingPhoneUser = await UserModel.findByPhone(phone_number);
            if (existingPhoneUser) {
                ResponseUtils.conflict(res, "Số điện thoại đã được sử dụng");
                return;
            }

            // Create new user
            const userId = await UserModel.create({
                fullname,
                email,
                phone_number,
                password,
                country_code: country_code || "+84",
                type_login: "Standard",
                role: "Customer",
            });

            // Get created user
            const newUser = await UserModel.findById(userId);
            if (!newUser) {
                ResponseUtils.error(res, "Lỗi tạo tài khoản");
                return;
            }

            // Generate tokens
            const tokenPayload = {
                userId: newUser.user_id,
                email: newUser.email,
                role: newUser.role,
            };

            const tokens = JWTUtils.generateTokenPair(tokenPayload);

            // Update last login
            await UserModel.updateLastLogin(userId);

            // Remove password from response
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { password: _, ...userWithoutPassword } = newUser;

            ResponseUtils.success(
                res,
                "Đăng ký thành công",
                {
                    user: userWithoutPassword,
                    tokens,
                },
                201,
            );
        } catch (error) {
            console.error("Register error:", error);
            ResponseUtils.error(res, "Lỗi server khi đăng ký");
        }
    }

    // Login user
    static async login(req: Request, res: Response): Promise<void> {
        try {
            const { email, password } = req.body;

            console.log("Email :" + email + "Password: " + password);

            // Find user by email
            const user = await UserModel.findByEmail(email);
            if (!user) {
                ResponseUtils.unauthorized(res, "Email hoặc mật khẩu không đúng");
                return;
            }

            // Verify password
            const isPasswordValid = await UserModel.verifyPassword(password, user.password);
            if (!isPasswordValid) {
                ResponseUtils.unauthorized(res, "Email hoặc mật khẩu không đúng");
                return;
            }

            // Generate tokens
            const tokenPayload = {
                userId: user.user_id,
                email: user.email,
                role: user.role,
            };

            const tokens = JWTUtils.generateTokenPair(tokenPayload);

            // Update last login
            await UserModel.updateLastLogin(user.user_id);

            // Remove password from response
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { password: _, ...userWithoutPassword } = user;

            ResponseUtils.success(res, "Đăng nhập thành công", {
                user: userWithoutPassword,
                tokens,
            });
        } catch (error) {
            console.error("Login error:", error);
            ResponseUtils.error(res, "Lỗi server khi đăng nhập");
        }
    }

    // Refresh token
    static async refreshToken(req: Request, res: Response): Promise<void> {
        try {
            const { refreshToken } = req.body;

            // Verify refresh token
            const payload = JWTUtils.verifyRefreshToken(refreshToken);

            // Check if user still exists
            const user = await UserModel.findById(payload.userId);
            if (!user) {
                ResponseUtils.unauthorized(res, "User không tồn tại");
                return;
            }

            // Generate new tokens
            const tokenPayload = {
                userId: user.user_id,
                email: user.email,
                role: user.role,
            };

            const tokens = JWTUtils.generateTokenPair(tokenPayload);

            ResponseUtils.success(res, "Token đã được làm mới", { tokens });
        } catch (error) {
            console.error("Refresh token error:", error);
            ResponseUtils.unauthorized(res, "Refresh token không hợp lệ");
        }
    }

    // Get current user profile
    static async getProfile(req: UserRequest, res: Response): Promise<void> {
        try {
            if (!req.userId) {
                ResponseUtils.unauthorized(res, "User không được xác thực");
                return;
            }

            const user = await UserModel.findById(req.userId);
            if (!user) {
                ResponseUtils.notFound(res, "User không tồn tại");
                return;
            }

            // Remove password from response
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { password: _, ...userWithoutPassword } = user;

            ResponseUtils.success(res, "Lấy thông tin profile thành công", {
                user: userWithoutPassword,
            });
        } catch (error) {
            console.error("Get profile error:", error);
            ResponseUtils.error(res, "Lỗi server khi lấy thông tin profile");
        }
    }

    // Update user profile
    static async updateProfile(req: UserRequest, res: Response): Promise<void> {
        try {
            if (!req.userId) {
                ResponseUtils.unauthorized(res, "User không được xác thực");
                return;
            }

            const { fullname, address, gender, date_of_birth, phone_number } = req.body;

            // Check if phone number is being changed and already exists
            if (phone_number) {
                const existingPhoneUser = await UserModel.findByPhone(phone_number);
                if (existingPhoneUser && existingPhoneUser.user_id !== req.userId) {
                    ResponseUtils.conflict(res, "Số điện thoại đã được sử dụng");
                    return;
                }
            }

            // Update user
            const updateData: Record<string, unknown> = {};
            if (fullname !== undefined) updateData.fullname = fullname;
            if (address !== undefined) updateData.address = address;
            if (gender !== undefined) updateData.gender = gender;
            if (date_of_birth !== undefined) updateData.date_of_birth = date_of_birth;
            if (phone_number !== undefined) updateData.phone_number = phone_number;

            const updated = await UserModel.update(req.userId, updateData);
            if (!updated) {
                ResponseUtils.error(res, "Cập nhật profile thất bại");
                return;
            }

            // Get updated user
            const updatedUser = await UserModel.findById(req.userId);
            if (!updatedUser) {
                ResponseUtils.error(res, "Lỗi lấy thông tin user sau khi cập nhật");
                return;
            }

            // Remove password from response
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { password: _, ...userWithoutPassword } = updatedUser;

            ResponseUtils.success(res, "Cập nhật profile thành công", {
                user: userWithoutPassword,
            });
        } catch (error) {
            console.error("Update profile error:", error);
            ResponseUtils.error(res, "Lỗi server khi cập nhật profile");
        }
    }

    // Change password
    static async changePassword(req: UserRequest, res: Response): Promise<void> {
        try {
            if (!req.userId) {
                ResponseUtils.unauthorized(res, "User không được xác thực");
                return;
            }

            const { currentPassword, newPassword } = req.body;

            // Get current user
            const user = await UserModel.findById(req.userId);
            if (!user) {
                ResponseUtils.notFound(res, "User không tồn tại");
                return;
            }

            // Verify current password
            const isCurrentPasswordValid = await UserModel.verifyPassword(currentPassword, user.password);
            if (!isCurrentPasswordValid) {
                ResponseUtils.unauthorized(res, "Mật khẩu hiện tại không đúng");
                return;
            }

            // Update password
            const updated = await UserModel.update(req.userId, { password: newPassword });
            if (!updated) {
                ResponseUtils.error(res, "Đổi mật khẩu thất bại");
                return;
            }

            ResponseUtils.success(res, "Đổi mật khẩu thành công");
        } catch (error) {
            console.error("Change password error:", error);
            ResponseUtils.error(res, "Lỗi server khi đổi mật khẩu");
        }
    }

    // Logout (set user offline)
    static async logout(req: UserRequest, res: Response): Promise<void> {
        try {
            if (req.userId) {
                await UserModel.setOffline(req.userId);
            }

            ResponseUtils.success(res, "Đăng xuất thành công");
        } catch (error) {
            console.error("Logout error:", error);
            ResponseUtils.error(res, "Lỗi server khi đăng xuất");
        }
    }

    // Forgot password (placeholder - would send email in real implementation)
    static async forgotPassword(req: Request, res: Response): Promise<void> {
        try {
            const { email } = req.body;

            // Check if user exists
            const user = await UserModel.findByEmail(email);
            if (!user) {
                // Don't reveal if email exists or not for security
                ResponseUtils.success(res, "Nếu email tồn tại, bạn sẽ nhận được hướng dẫn khôi phục mật khẩu");
                return;
            }

            // TODO: In real implementation, generate reset token and send email
            // For now, just return success message
            ResponseUtils.success(res, "Email khôi phục mật khẩu đã được gửi (chức năng này đang phát triển)");
        } catch (error) {
            console.error("Forgot password error:", error);
            ResponseUtils.error(res, "Lỗi server khi xử lý yêu cầu quên mật khẩu");
        }
    }

    // Sign in / register with Google idToken
    static async googleSignIn(req: Request, res: Response): Promise<void> {
        try {
            const { idToken } = req.body;
            if (!idToken) {
                ResponseUtils.badRequest(res, "Missing idToken");
                return;
            }

            const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
            if (!GOOGLE_CLIENT_ID) {
                console.error("Missing GOOGLE_CLIENT_ID env");
                ResponseUtils.error(res, "Server config error");
                return;
            }

            const client = new OAuth2Client(GOOGLE_CLIENT_ID);

            const ticket = await client.verifyIdToken({
                idToken,
                audience: GOOGLE_CLIENT_ID,
            });
            const payload = ticket.getPayload();
            if (!payload) {
                ResponseUtils.unauthorized(res, "Invalid Google idToken");
                return;
            }

            const googleId = payload.sub;
            const email = payload.email || "";
            const fullname = payload.name || "";
            const picture = payload.picture || "";

            // Find existing user by email
            let user = await UserModel.findByEmail(email);

            if (user) {
                // Update user to mark google login (optional fields)
                await UserModel.update(user.user_id, {
                    fullname,
                    avatar: picture,
                    type_login: "Google",
                    google_id: googleId,
                });
            } else {
                // Create new user (password empty, type_login Google)
                const newUserId = await UserModel.create({
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
                user = await UserModel.findById(newUserId);
            }

            if (!user) {
                ResponseUtils.error(res, "Không thể tạo hoặc lấy thông tin user");
                return;
            }

            // Generate tokens
            const tokenPayload: TokenPayload = {
                userId: user.user_id,
                email: user.email,
                role: user.role,
            };
            const tokens = JWTUtils.generateTokenPair(tokenPayload);

            // Update last login
            await UserModel.updateLastLogin(user.user_id);

            // Remove password from response
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { password: _, ...userWithoutPassword } = user;

            ResponseUtils.success(res, "Đăng nhập bằng Google thành công", {
                user: userWithoutPassword,
                tokens,
            });
        } catch (error) {
            console.error("Google sign-in error:", error);
            ResponseUtils.unauthorized(res, "Google idToken không hợp lệ hoặc lỗi server");
        }
    }
}

export default AuthController;
