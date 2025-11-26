// API Configuration
const API_CONFIG = {
    BASE_URL: process.env.EXPO_PUBLIC_BACKEND_URL || "http://localhost:3000",
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
    TIMEOUT: 20000, // 20 seconds
};

export default API_CONFIG;
