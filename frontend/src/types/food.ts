export interface Food {
    id: string;
    name: string;
    description?: string;
    price: number;
    discount_price?: number;
    category_id: string;
    restaurant_id: string;
    image_url?: string;
    rating: number;
    total_reviews: number;
    is_available: boolean;
    prep_time?: number;
    created_at: string;
    updated_at: string;
}

export interface Category {
    id: string;
    name: string;
    description?: string;
    image_url?: string;
    is_active: boolean;
    sort_order: number;
    created_at: string;
    updated_at: string;
}

export interface Restaurant {
    id: string;
    name: string;
    description?: string;
    address: string;
    phone: string;
    email?: string;
    image_url?: string;
    rating: number;
    total_reviews: number;
    is_active: boolean;
    delivery_fee: number;
    min_order: number;
    delivery_time: string;
    created_at: string;
    updated_at: string;
}

export interface FoodWithDetails extends Food {
    category: Category;
    restaurant: Restaurant;
}

export interface ApiResponse<T> {
    success: boolean;
    message: string;
    data?: T;
}

export interface FoodListResponse {
    foods: FoodWithDetails[];
    categories: Category[];
    restaurants: Restaurant[];
    pagination?: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}
