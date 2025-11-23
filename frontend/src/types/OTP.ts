export interface OTP {
    otp_id: string;
    info: string;
    country_code?: string | null;
    otp: string;
    expires_at: string;
    created_at?: string;
}
