// API Configuration
export const API_CONFIG = {
    BASE_URL: process.env.EXPO_PUBLIC_API_URL || "http://192.168.3.3:5678",
    ENDPOINTS: {
        AUTH: {
            REGISTER: "/api/auth/register",
            LOGIN: "/api/auth/login",
            LOGOUT: "/api/auth/logout",
            REFRESH_TOKEN: "/api/auth/refresh-token",
            FORGOT_PASSWORD: "/api/auth/forgot-password",
            PROFILE: "/api/auth/profile",
            CHANGE_PASSWORD: "/api/auth/change-password",
        },
    },
    TIMEOUT: 10000, // 10 seconds
};

export default API_CONFIG;
