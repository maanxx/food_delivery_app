export type InvoiceStatus = "Paid" | "Pending" | "Cancelled";
export type PaymentMethod = "Credit Card" | "Momo" | "Zalo Pay" | "Bank Transfer" | "Cash";

export interface Invoice {
    invoice_id: string;
    customer_id: string;
    employee_id: string;
    shipping_fee: number;
    discount_amount: number;
    total_amount: number;
    payment_method: PaymentMethod;
    status: InvoiceStatus;
    created_at?: string;
    updated_at?: string;
}
