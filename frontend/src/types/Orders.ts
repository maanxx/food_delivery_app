export type OrderStatus = "Pending" | "In Progress" | "Completed" | "Cancelled";

export interface Order {
    order_id: string;
    user_id?: string;
    quantity: number;
    foods: string; // raw JSON or CSV from DB; parse at API layer
    order_note?: string | null;
    order_status: OrderStatus;
    order_date?: string;
}
