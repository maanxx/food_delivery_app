export interface CartItem {
    cart_item_id: string;
    dish_id?: string;
    cart_id?: string;
    quantity: number;
    created_at?: string;
    updated_at?: string;
    // frontend helpers
    name?: string;
    price?: number;
    image_url?: string;
}
