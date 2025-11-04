export interface User {
    user_id: string;
    fullname?: string;
    address?: string;
    gender?: "Male" | "Female" | "Other";
    date_of_birth?: string;
    username?: string;
    email: string;
    phone_number: string;
    country_code: string;
    role: "Admin" | "Customer" | "Owner" | "Employee";
    avatar_path?: string;
    payment_method?: "Credit Card" | "Momo" | "Zalo Pay" | "Bank Transfer" | "Cash";
    created_at?: string;
    updated_at?: string;
    last_login?: string;
    is_online?: boolean;
}

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface RegisterData {
    fullname: string;
    email: string;
    phone_number: string;
    password: string;
    country_code?: string;
}

export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
}

export interface AuthResponse {
    success: boolean;
    message: string;
    data?: {
        user: User;
        tokens: AuthTokens;
    };
    errors?: string[];
}

export interface ApiResponse<T = unknown> {
    success: boolean;
    message: string;
    data?: T;
    errors?: string[];
    meta?: {
        timestamp: string;
        path?: string;
        method?: string;
    };
}

export interface ForgotPasswordData {
    email: string;
}

export interface ChangePasswordData {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
}

export interface UpdateProfileData {
    fullname?: string;
    address?: string;
    gender?: "Male" | "Female" | "Other";
    date_of_birth?: string;
    phone_number?: string;
}
