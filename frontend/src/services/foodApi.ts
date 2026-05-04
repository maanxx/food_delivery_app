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
            console.log(`[FoodApi] Requesting (${method}): ${url}`);

            const options: RequestInit = {
                method,
                headers: {
                    "Content-Type": "application/json",
                },
            };

            if (data && method !== "GET") {
                options.body = JSON.stringify(data);
            }

            const res = await fetch(url, options);
            
            const contentType = res.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
                const text = await res.text();
                console.error(`[FoodApi] Non-JSON response from ${endpoint}:`, text.substring(0, 100));
                throw new Error(`Server returned non-JSON response (${res.status})`);
            }

            const responseData = await res.json();

            if (!res.ok) {
                throw new Error(responseData?.message || `Request failed with status ${res.status}`);
            }

            return responseData;
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
        const endpoint = `${API_CONFIG.ENDPOINTS.FOOD.ALL}${queryString ? `?${queryString}` : ""}`;

        return this.makeRequest<FoodListResponse>(endpoint);
    }

    // Lấy thông tin chi tiết món ăn
    async getFoodById(id: string): Promise<ApiResponse<FoodWithDetails>> {
        return this.makeRequest<FoodWithDetails>(`${API_CONFIG.ENDPOINTS.FOOD.ALL}/${id}`);
    }

    // Lấy danh sách categories
    async getCategories(): Promise<ApiResponse<Category[]>> {
        return this.makeRequest<Category[]>(API_CONFIG.ENDPOINTS.FOOD.CATEGORIES);
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
        const endpoint = `${API_CONFIG.ENDPOINTS.FOOD.RESTAURANTS}${queryString ? `?${queryString}` : ""}`;

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

        return this.makeRequest<FoodWithDetails[]>(`${API_CONFIG.ENDPOINTS.FOOD.SEARCH}?${queryParams.toString()}`);
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
        const endpoint = `${API_CONFIG.ENDPOINTS.FOOD.CATEGORIES}/${categoryId}/foods${queryString ? `?${queryString}` : ""}`;

        return this.makeRequest<FoodWithDetails[]>(endpoint);
    }

    // Lấy món ăn nổi bật
    async getFeaturedFoods(limit: number = 10): Promise<ApiResponse<FoodWithDetails[]>> {
        return this.makeRequest<FoodWithDetails[]>(`${API_CONFIG.ENDPOINTS.FOOD.FEATURED}?limit=${limit}`);
    }

    // Lấy món ăn bán chạy
    async getPopularFoods(limit: number = 10): Promise<ApiResponse<FoodWithDetails[]>> {
        return this.makeRequest<FoodWithDetails[]>(`${API_CONFIG.ENDPOINTS.FOOD.POPULAR}?limit=${limit}`);
    }
}

export const foodApiClient = new FoodApiClient();
export default foodApiClient;
