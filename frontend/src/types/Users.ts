export type Gender = "Male" | "Female" | "Other";
export type LoginType = "Standard" | "Google" | "Facebook" | "Apple";
export type UserRole = "Admin" | "Customer" | "Owner" | "Employee";
export type PaymentMethod = "Credit Card" | "Momo" | "Zalo Pay" | "Bank Transfer" | "Cash";

export interface User {
    user_id: string;
    fullname?: string | null;
    address?: string | null;
    gender?: Gender | null;
    date_of_birth?: string | null; // ISO date
    password?: string;
    username?: string | null;
    type_login?: LoginType;
    email?: string | null;
    phone_number?: string;
    country_code?: string;
    role?: UserRole;
    avatar_path?: string | null;
    payment_method?: PaymentMethod;
    created_at?: string;
    updated_at?: string;
    last_login?: string | null;
    is_online?: boolean;
}
