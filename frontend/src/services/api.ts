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
        console.log("BASE_URL: " + API_CONFIG.BASE_URL);
        this.baseURL = API_CONFIG.BASE_URL;
    }

    private async getAccessToken(): Promise<string | null> {
        try {
            return await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
        } catch (error) {
            console.error("Error getting access token:", error);
            return null;
        }
    }

    private async getRefreshToken(): Promise<string | null> {
        try {
            return await AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
        } catch (error) {
            console.error("Error getting refresh token:", error);
            return null;
        }
    }

    private async setTokens(tokens: AuthTokens): Promise<void> {
        try {
            await AsyncStorage.multiSet([
                [STORAGE_KEYS.ACCESS_TOKEN, tokens.accessToken],
                [STORAGE_KEYS.REFRESH_TOKEN, tokens.refreshToken],
            ]);
        } catch (error) {
            console.error("Error setting tokens:", error);
        }
    }

    private async clearTokens(): Promise<void> {
        try {
            await AsyncStorage.multiRemove([
                STORAGE_KEYS.ACCESS_TOKEN,
                STORAGE_KEYS.REFRESH_TOKEN,
                STORAGE_KEYS.USER_DATA,
            ]);
        } catch (error) {
            console.error("Error clearing tokens:", error);
        }
    }

    private async setUserData(user: User): Promise<void> {
        try {
            await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
        } catch (error) {
            console.error("Error setting user data:", error);
        }
    }

    async getUserData(): Promise<User | null> {
        try {
            const userData = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
            return userData ? JSON.parse(userData) : null;
        } catch (error) {
            console.error("Error getting user data:", error);
            return null;
        }
    }

    private async refreshAccessToken(): Promise<boolean> {
        try {
            const refreshToken = await this.getRefreshToken();
            if (!refreshToken) return false;

            const response = await fetch(`${this.baseURL}${API_CONFIG.ENDPOINTS.AUTH.REFRESH_TOKEN}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ refreshToken }),
            });

            const data: ApiResponse<{ tokens: AuthTokens }> = await response.json();

            if (data.success && data.data?.tokens) {
                await this.setTokens(data.data.tokens);
                return true;
            }

            return false;
        } catch (error) {
            console.error("Error refreshing token:", error);
            return false;
        }
    }

    private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
        try {
            const url = `${this.baseURL}${endpoint}`;
            console.log("API Request:", url, options.method || "GET");
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
                const refreshSuccess = await this.refreshAccessToken();
                if (refreshSuccess) {
                    const newAccessToken = await this.getAccessToken();
                    if (newAccessToken) {
                        headers.Authorization = `Bearer ${newAccessToken}`;
                        response = await fetch(url, {
                            ...options,
                            headers,
                            timeout: API_CONFIG.TIMEOUT,
                        });
                    }
                }
            }

            const data: ApiResponse<T> = await response.json();
            return data;
        } catch (error) {
            console.error("API request error:", error);
            return {
                success: false,
                message: "Lỗi kết nối mạng. Vui lòng kiểm tra kết nối internet.",
                errors: [error instanceof Error ? error.message : "Unknown error"],
            };
        }
    }

    // Auth API methods
    async register(registerData: RegisterData): Promise<AuthResponse> {
        const response = await this.makeRequest<{ user: User; tokens: AuthTokens }>(
            API_CONFIG.ENDPOINTS.AUTH.REGISTER,
            {
                method: "POST",
                body: JSON.stringify(registerData),
            },
        );

        if (response.success && response.data) {
            await this.setTokens(response.data.tokens);
            await this.setUserData(response.data.user);
        }

        return response as AuthResponse;
    }

    async login(credentials: LoginCredentials): Promise<AuthResponse> {
        const response = await this.makeRequest<{ user: User; tokens: AuthTokens }>(API_CONFIG.ENDPOINTS.AUTH.LOGIN, {
            method: "POST",
            body: JSON.stringify(credentials),
        });

        if (response.success && response.data) {
            await this.setTokens(response.data.tokens);
            await this.setUserData(response.data.user);
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
        return await this.makeRequest<{ user: User }>(API_CONFIG.ENDPOINTS.AUTH.PROFILE);
    }

    async updateProfile(profileData: UpdateProfileData): Promise<ApiResponse<{ user: User }>> {
        const response = await this.makeRequest<{ user: User }>(API_CONFIG.ENDPOINTS.AUTH.PROFILE, {
            method: "PUT",
            body: JSON.stringify(profileData),
        });

        if (response.success && response.data) {
            await this.setUserData(response.data.user);
        }

        return response;
    }

    async changePassword(passwordData: ChangePasswordData): Promise<ApiResponse> {
        return await this.makeRequest(API_CONFIG.ENDPOINTS.AUTH.CHANGE_PASSWORD, {
            method: "POST",
            body: JSON.stringify(passwordData),
        });
    }

    async forgotPassword(forgotData: ForgotPasswordData): Promise<ApiResponse> {
        return await this.makeRequest(API_CONFIG.ENDPOINTS.AUTH.FORGOT_PASSWORD, {
            method: "POST",
            body: JSON.stringify(forgotData),
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
