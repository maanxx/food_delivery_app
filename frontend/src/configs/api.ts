const BASE_URL = process.env.EXPO_PUBLIC_API_URL;

console.log("BASE_URL:", BASE_URL);

if (!BASE_URL) {
  throw new Error("Missing API URL: Check your .env file");
}

const API_CONFIG = {
    BASE_URL: BASE_URL,
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
