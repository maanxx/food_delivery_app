const BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://192.168.1.86:5678";

console.log("[Config] API BASE_URL:", BASE_URL);
console.log("[Config] SOCKET URL:", process.env.EXPO_PUBLIC_SOCKET_URL || BASE_URL);

const API_CONFIG = {
    BASE_URL: BASE_URL,
    SOCKET_URL: process.env.EXPO_PUBLIC_SOCKET_URL || BASE_URL,
    ENDPOINTS: {
        AUTH: {
            REGISTER: "/api/auth/register-user",
            LOGIN: "/api/auth/login-user",
            LOGOUT: "/api/auth/logout-user",
            REFRESH_TOKEN: "/api/auth/refresh",
            FORGOT_PASSWORD: "/api/auth/forgot-password/send-otp",
            VERIFY_OTP: "/api/auth/forgot-password/verify-otp",
            RESET_PASSWORD: "/api/auth/forgot-password/reset-password",
            PROFILE: "/api/user/profile",
            CHANGE_PASSWORD: "/api/user/password",
            USERS: "/api/user/search",
        },
        FOOD: {
            ALL: "/api/dish",
            CATEGORIES: "/api/category",
            RESTAURANTS: "/api/restaurant",
            POPULAR: "/api/dish", // Using base dishes as popular
            FEATURED: "/api/dish", // Using base dishes as featured
            SEARCH: "/api/dish",   // getDishes handles 'name' query
            DETAILS: "/api/dish",  // /api/dish/:id
        },
        CART: {
            GET: "/api/cart",
            ADD_ITEM: "/api/cart/items",
            UPDATE_ITEM: "/api/cart/items", // /api/cart/items/:id
            DELETE_ITEM: "/api/cart/items", // /api/cart/items/:id
            CLEAR: "/api/cart/items/clear",
        },
        ORDER: {
            HISTORY: "/api/user/orders",
            DETAILS: "/api/user/orders", // /api/user/orders/:id
            CREATE: "/api/user/orders",
            REORDER: "/api/user/orders", // /api/user/orders/:id/reorder
        },
        ADDRESS: {
            USER_ADDRESSES: "/api/user/addresses",
            BASE: "/api/user/addresses",
        },
        FAVORITE: {
            USER_FAVORITES: "/api/favorites",
            REMOVE: "/api/favorites/remove",
            ADD: "/api/favorites/add",
        },
        CHAT: {
            CONVERSATIONS: "/api/conversations",
            MESSAGES: "/api/conversations/messages",
            UPLOAD: "/api/upload",
            CHATBOT: "/api/chat",
        }
    },
    TIMEOUT: 20000, // 20 seconds
};

export default API_CONFIG;
