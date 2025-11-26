export interface Dish {
    dish_id: string;
    category_id?: string | null;
    thumbnail_path?: string;
    name: string;
    description?: string | null;
    price: number;
    available?: boolean;
    points?: number;
    rate_quantity?: number;
    discount_amount?: number;
    created_at?: string;
    update_at?: string;
}

/** Frontend convenience type when backend returns joined/augmented fields */
export interface DishWithDetails extends Dish {
    image_url?: string;
    rating?: number;
    total_reviews?: number;
    prep_time?: number;
}
