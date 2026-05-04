const BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://192.168.1.86:5000";

console.log("[Config] BASE_URL:", BASE_URL);

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
            USERS: "/api/auth/users",
        },
        FOOD: {
            ALL: "/api/dishes",
            CATEGORIES: "/api/category",
            RESTAURANTS: "/api/restaurant",
            POPULAR: "/api/dishes/popular",
            FEATURED: "/api/dishes/featured",
            SEARCH: "/api/dishes/search",
        },
        INVOICE: {
            USER_INVOICES: "/api/invoice",
            CREATE: "/api/invoice/create",
            ITEMS: "/api/invoice-items",
        },
        ADDRESS: {
            USER_ADDRESSES: "/api/addresses/user",
            BASE: "/api/addresses",
        },
        FAVORITE: {
            USER_FAVORITES: "/api/favorite",
            REMOVE: "/api/favorite/remove",
        },
        CHAT: {
            CONVERSATIONS: "/api/conversations",
            MESSAGES: "/api/conversations/messages",
            UPLOAD: "/api/upload",
        }
    },
    TIMEOUT: 20000, // 20 seconds
};

export default API_CONFIG;
