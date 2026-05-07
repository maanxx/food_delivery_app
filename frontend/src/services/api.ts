import AsyncStorage from "@react-native-async-storage/async-storage";
import API_CONFIG from "../configs/api";
import {
    LoginCredentials,
    RegisterData,
    AuthResponse,
    ApiResponse,
    User,
    AuthTokens,
    ForgotPasswordData,
    ChangePasswordData,
    UpdateProfileData,
} from "../types/auth";

const STORAGE_KEYS = {
    ACCESS_TOKEN: "access_token",
    REFRESH_TOKEN: "refresh_token",
    USER_DATA: "user_data",
};

class ApiClient {
    private baseURL: string;

    constructor() {
        console.log("[ApiClient] Initialized with BASE_URL:", API_CONFIG.BASE_URL);
        this.baseURL = API_CONFIG.BASE_URL;
    }

    private async getAccessToken(): Promise<string | null> {
        try {
            return await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
        } catch (error) {
            console.error("[ApiClient] Error getting access token:", error);
            return null;
        }
    }

    private async getRefreshToken(): Promise<string | null> {
        try {
            return await AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
        } catch (error) {
            console.error("[ApiClient] Error getting refresh token:", error);
            return null;
        }
    }

    private async setTokens(tokens: AuthTokens): Promise<void> {
        try {
            await AsyncStorage.multiSet([
                [STORAGE_KEYS.ACCESS_TOKEN, tokens.accessToken],
                [STORAGE_KEYS.REFRESH_TOKEN, tokens.refreshToken],
            ]);
            console.log("[ApiClient] Tokens saved to storage");
        } catch (error) {
            console.error("[ApiClient] Error setting tokens:", error);
        }
    }

    private async clearTokens(): Promise<void> {
        try {
            await AsyncStorage.multiRemove([
                STORAGE_KEYS.ACCESS_TOKEN,
                STORAGE_KEYS.REFRESH_TOKEN,
                STORAGE_KEYS.USER_DATA,
            ]);
            console.log("[ApiClient] Tokens cleared from storage");
        } catch (error) {
            console.error("[ApiClient] Error clearing tokens:", error);
        }
    }

    private async setUserData(user: User): Promise<void> {
        try {
            await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
            console.log("[ApiClient] User data saved to storage");
        } catch (error) {
            console.error("[ApiClient] Error setting user data:", error);
        }
    }

    async getUserData(): Promise<User | null> {
        try {
            const userData = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
            return userData ? JSON.parse(userData) : null;
        } catch (error) {
            console.error("[ApiClient] Error getting user data:", error);
            return null;
        }
    }

    private async refreshAccessToken(): Promise<boolean> {
        try {
            const refreshToken = await this.getRefreshToken();
            if (!refreshToken) return false;

            console.log("[ApiClient] Attempting to refresh token...");
            const response = await fetch(`${this.baseURL}${API_CONFIG.ENDPOINTS.AUTH.REFRESH_TOKEN}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ refreshToken }),
            });

            if (!response.ok) {
                console.error("[ApiClient] Refresh token failed with status:", response.status);
                return false;
            }

            const data = await response.json();

            if (data.success && data.accessToken) {
                // Backend might return only accessToken or both
                const tokens: AuthTokens = {
                    accessToken: data.accessToken,
                    refreshToken: data.refreshToken || refreshToken, // Use old one if not returned
                };
                await this.setTokens(tokens);
                console.log("[ApiClient] Token refreshed successfully");
                return true;
            }

            return false;
        } catch (error) {
            console.error("[ApiClient] Error refreshing token:", error);
            return false;
        }
    }

    private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
        const url = `${this.baseURL}${endpoint}`;
        const method = options.method || "GET";
        
        try {
            console.log(`[ApiClient] Request: ${method} ${url}`);
            const accessToken = await this.getAccessToken();

            const headers: HeadersInit = {
                "Content-Type": "application/json",
                ...options.headers,
            };

            if (accessToken) {
                headers.Authorization = `Bearer ${accessToken}`;
            }

            let response = await fetch(url, {
                ...options,
                headers,
            });

            // If unauthorized and we have a refresh token, try to refresh
            if (response.status === 401 && accessToken) {
                console.log("[ApiClient] 401 Unauthorized, attempting token refresh...");
                const refreshSuccess = await this.refreshAccessToken();
                if (refreshSuccess) {
                    const newAccessToken = await this.getAccessToken();
                    if (newAccessToken) {
                        headers.Authorization = `Bearer ${newAccessToken}`;
                        console.log("[ApiClient] Retrying request with new token...");
                        response = await fetch(url, {
                            ...options,
                            headers,
                            timeout: API_CONFIG.TIMEOUT,
                        });
                    }
                }
            }

            if (!response.ok) {
                console.warn(`[ApiClient] Request failed: ${method} ${endpoint} - Status: ${response.status}`);
            }

            const contentType = response.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
                const text = await response.text();
                console.error(`[ApiClient] Non-JSON response from ${endpoint}:`, text.substring(0, 200));
                return {
                    success: false,
                    message: `Lỗi máy chủ (${response.status})`,
                    errors: ["Server returned non-JSON response"],
                };
            }

            const data = await response.json();
            
            // Normalize backend response to mobile app's expected ApiResponse format
            // Mobile app expects { success: boolean, data: T, message: string }
            // Backend often returns { success: boolean, message: string, ...rest } where rest is the data
            if (data && typeof data === 'object' && !('data' in data)) {
                // If backend didn't wrap in 'data', we wrap it ourselves for the mobile app's services
                const { success, message, ...rest } = data;
                return {
                    success: success !== undefined ? success : response.ok,
                    message: message || (response.ok ? "Thành công" : "Thất bại"),
                    data: rest as unknown as T,
                };
            }

            return data as ApiResponse<T>;
        } catch (error) {
            console.error(`[ApiClient] Network error during ${method} ${endpoint}:`, error);
            return {
                success: false,
                message: "Lỗi kết nối mạng. Vui lòng kiểm tra kết nối internet.",
                errors: [error instanceof Error ? error.message : "Unknown error"],
            };
        }
    }

    // Auth API methods
    async register(registerData: RegisterData): Promise<AuthResponse> {
        // Map RegisterData to backend's registerUser expected fields
        const backendData = {
            username: registerData.fullname,
            phone: registerData.phone_number,
            email: registerData.email,
            password: registerData.password,
            countryCode: registerData.country_code || "+84",
        };

        const response = await this.makeRequest<any>(
            API_CONFIG.ENDPOINTS.AUTH.REGISTER,
            {
                method: "POST",
                body: JSON.stringify(backendData),
            },
        );

        if (response.success && response.data) {
            const { accessToken, refreshToken, user } = response.data;
            if (accessToken && refreshToken) {
                await this.setTokens({ accessToken, refreshToken });
            }
            if (user) {
                await this.setUserData(user);
            }
        }

        return response as AuthResponse;
    }

    async login(credentials: LoginCredentials): Promise<AuthResponse> {
        // The mobile app sends { email, password }
        // Our modified backend now supports { email, password } or { phone, countryCode, password }
        const response = await this.makeRequest<any>(API_CONFIG.ENDPOINTS.AUTH.LOGIN, {
            method: "POST",
            body: JSON.stringify(credentials),
        });

        if (response.success && response.data) {
            const { accessToken, refreshToken, user } = response.data;
            if (accessToken && refreshToken) {
                await this.setTokens({ accessToken, refreshToken });
            }
            if (user) {
                await this.setUserData(user);
            }
        }

        return response as AuthResponse;
    }

    async logout(): Promise<ApiResponse> {
        const response = await this.makeRequest(API_CONFIG.ENDPOINTS.AUTH.LOGOUT, {
            method: "POST",
        });

        // Clear tokens regardless of response
        await this.clearTokens();

        return response;
    }

    async getProfile(): Promise<ApiResponse<{ user: User }>> {
        // Backend /api/user/profile returns the user object directly or { user: ... }
        return await this.makeRequest<{ user: User }>(API_CONFIG.ENDPOINTS.AUTH.PROFILE);
    }

    async updateProfile(profileData: UpdateProfileData): Promise<ApiResponse<{ user: User }>> {
        const response = await this.makeRequest<{ user: User }>(API_CONFIG.ENDPOINTS.AUTH.PROFILE, {
            method: "PUT",
            body: JSON.stringify(profileData),
        });

        if (response.success && response.data) {
            // Profile updates might return the user directly
            const user = response.data.user || (response.data as unknown as User);
            await this.setUserData(user);
        }

        return response;
    }

    async changePassword(passwordData: ChangePasswordData): Promise<ApiResponse> {
        // Backend uses /api/user/password (PUT)
        // passwordData is { currentPassword, newPassword, confirmPassword }
        // Backend expects { old_password, new_password }
        const backendData = {
            old_password: passwordData.currentPassword,
            new_password: passwordData.newPassword,
        };

        return await this.makeRequest(API_CONFIG.ENDPOINTS.AUTH.CHANGE_PASSWORD, {
            method: "PUT",
            body: JSON.stringify(backendData),
        });
    }

    async forgotPassword(forgotData: ForgotPasswordData): Promise<ApiResponse> {
        // Backend uses /api/auth/forgot-password/send-otp
        // forgotData is { email }
        // Backend expects { info: email/phone }
        return await this.makeRequest(API_CONFIG.ENDPOINTS.AUTH.FORGOT_PASSWORD, {
            method: "POST",
            body: JSON.stringify({ info: forgotData.email }),
        });
    }

    async isAuthenticated(): Promise<boolean> {
        const accessToken = await this.getAccessToken();
        return !!accessToken;
    }
}

// Export singleton instance
export const apiClient = new ApiClient();
export default apiClient;
