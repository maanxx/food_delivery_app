import API_CONFIG from "../configs/api";
import { ApiResponse, Food, Category, Restaurant, FoodWithDetails, FoodListResponse } from "../types/food";

class FoodApiClient {
    private async makeRequest<T>(
        endpoint: string,
        method: "GET" | "POST" | "PUT" | "DELETE" = "GET",
        data?: any,
    ): Promise<ApiResponse<T>> {
        try {
            const url = `${API_CONFIG.BASE_URL}${endpoint}`;
            // Kiểm tra log này khi chạy app:
            console.log("Food API Request:", url, method);

            const options: RequestInit = {
                method,
                headers: {
                    "Content-Type": "application/json",
                },
            };

            if (data && method !== "GET") {
                options.body = JSON.stringify(data);
            }

            const response = await fetch(url, options);
            const responseText = await response.text();
            // console.log("Food API Response Text:", responseText);

            let result;
            try {
                result = JSON.parse(responseText);
            } catch (parseError) {
                console.error("JSON Parse Error:", parseError);
                console.error("Response was:", responseText);
                throw new Error(`Invalid JSON response: ${responseText.substring(0, 100)}...`);
            }

            if (!response.ok) {
                throw new Error(result.message || `HTTP error! status: ${response.status}`);
            }

            return result;
        } catch (error) {
            console.error("Food API Error:", error);
            return {
                success: false,
                message: error instanceof Error ? error.message : "Có lỗi xảy ra",
            };
        }
    }

    // Lấy danh sách tất cả món ăn
    async getAllFoods(params?: {
        category_id?: string;
        search?: string;
        page?: number;
        limit?: number;
    }): Promise<ApiResponse<FoodListResponse>> {
        const queryParams = new URLSearchParams();

        if (params?.category_id) queryParams.append("category_id", params.category_id);
        if (params?.restaurant_id) queryParams.append("restaurant_id", params.restaurant_id);
        if (params?.search) queryParams.append("search", params.search);
        if (params?.page) queryParams.append("page", params.page.toString());
        if (params?.limit) queryParams.append("limit", params.limit.toString());

        const queryString = queryParams.toString();
        const endpoint = `/api/foods${queryString ? `?${queryString}` : ""}`;

        return this.makeRequest<FoodListResponse>(endpoint);
    }

    // Lấy thông tin chi tiết món ăn
    async getFoodById(id: string): Promise<ApiResponse<FoodWithDetails>> {
        return this.makeRequest<FoodWithDetails>(`/api/foods/${id}`);
    }

    // Lấy danh sách categories
    async getCategories(): Promise<ApiResponse<Category[]>> {
        return this.makeRequest<Category[]>("/api/categories");
    }

    // Lấy danh sách restaurants
    async getRestaurants(params?: {
        is_active?: boolean;
        page?: number;
        limit?: number;
    }): Promise<ApiResponse<Restaurant[]>> {
        const queryParams = new URLSearchParams();

        if (params?.is_active !== undefined) {
            queryParams.append("is_active", params.is_active.toString());
        }
        if (params?.page) queryParams.append("page", params.page.toString());
        if (params?.limit) queryParams.append("limit", params.limit.toString());

        const queryString = queryParams.toString();
        const endpoint = `/api/restaurants${queryString ? `?${queryString}` : ""}`;

        return this.makeRequest<Restaurant[]>(endpoint);
    }

    // Tìm kiếm món ăn
    async searchFoods(
        query: string,
        filters?: {
            category_id?: string;
            min_price?: number;
            max_price?: number;
            rating?: number;
        },
    ): Promise<ApiResponse<FoodWithDetails[]>> {
        const queryParams = new URLSearchParams();
        queryParams.append("search", query);

        if (filters?.category_id) queryParams.append("category_id", filters.category_id);
        if (filters?.min_price) queryParams.append("min_price", filters.min_price.toString());
        if (filters?.max_price) queryParams.append("max_price", filters.max_price.toString());
        if (filters?.rating) queryParams.append("rating", filters.rating.toString());

        return this.makeRequest<FoodWithDetails[]>(`/api/foods/search?${queryParams.toString()}`);
    }

    // Lấy món ăn theo category
    async getFoodsByCategory(
        categoryId: string,
        params?: {
            page?: number;
            limit?: number;
        },
    ): Promise<ApiResponse<FoodWithDetails[]>> {
        const queryParams = new URLSearchParams();
        if (params?.page) queryParams.append("page", params.page.toString());
        if (params?.limit) queryParams.append("limit", params.limit.toString());

        const queryString = queryParams.toString();
        const endpoint = `/api/categories/${categoryId}/foods${queryString ? `?${queryString}` : ""}`;

        return this.makeRequest<FoodWithDetails[]>(endpoint);
    }

    // Lấy món ăn nổi bật
    async getFeaturedFoods(limit: number = 10): Promise<ApiResponse<FoodWithDetails[]>> {
        return this.makeRequest<FoodWithDetails[]>(`/api/foods/featured?limit=${limit}`);
    }

    // Lấy món ăn bán chạy
    async getPopularFoods(limit: number = 10): Promise<ApiResponse<FoodWithDetails[]>> {
        return this.makeRequest<FoodWithDetails[]>(`/api/foods/popular?limit=${limit}`);
    }
}

export const foodApiClient = new FoodApiClient();
export default foodApiClient;
