export type VoucherDiscountType = "Percentage" | "Amount";

export interface Voucher {
    voucher_id: string;
    code: string;
    description?: string | null;
    discount_type: VoucherDiscountType;
    discount_value: number;
    valid_from: string;
    valid_to: string;
    min_purchase?: number;
    number_of_uses?: number;
    created_at?: string;
    updated_at?: string;
}
