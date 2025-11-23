export interface Review {
    review_id: string;
    user_id?: string;
    dish_id?: string;
    points: number;
    content: string;
    created_at?: string;
    updated_at?: string;
}
