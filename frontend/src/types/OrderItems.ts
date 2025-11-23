export interface OrderItem {
    order_item_id: string;
    order_id?: string;
    dish_id?: string;
    quantity: number;
    created_at?: string;
    updated_at?: string;
}
