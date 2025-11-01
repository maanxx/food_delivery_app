import React, { createContext, useContext, useReducer, useEffect, useCallback, ReactNode } from "react";
import { foodApiClient } from "../services/foodApi";
import { FoodWithDetails, Category, Restaurant } from "../types/food";

interface FoodState {
    foods: FoodWithDetails[];
    categories: Category[];
    restaurants: Restaurant[];
    featuredFoods: FoodWithDetails[];
    popularFoods: FoodWithDetails[];
    isLoading: boolean;
    error: string | null;
}

type FoodAction =
    | { type: "FOOD_LOADING" }
    | { type: "FOOD_SUCCESS"; payload: { foods: FoodWithDetails[] } }
    | { type: "CATEGORIES_SUCCESS"; payload: { categories: Category[] } }
    | { type: "RESTAURANTS_SUCCESS"; payload: { restaurants: Restaurant[] } }
    | { type: "FEATURED_FOODS_SUCCESS"; payload: { featuredFoods: FoodWithDetails[] } }
    | { type: "POPULAR_FOODS_SUCCESS"; payload: { popularFoods: FoodWithDetails[] } }
    | { type: "FOOD_ERROR"; payload: { error: string } }
    | { type: "CLEAR_ERROR" };

interface FoodContextType extends FoodState {
    loadAllFoods: (params?: { category_id?: string; search?: string }) => Promise<void>;
    loadCategories: () => Promise<void>;
    loadRestaurants: () => Promise<void>;
    loadFeaturedFoods: () => Promise<void>;
    loadPopularFoods: () => Promise<void>;
    searchFoods: (query: string, filters?: any) => Promise<FoodWithDetails[]>;
    clearError: () => void;
    refreshAllData: () => Promise<void>;
}

const initialState: FoodState = {
    foods: [],
    categories: [],
    restaurants: [],
    featuredFoods: [],
    popularFoods: [],
    isLoading: false,
    error: null,
};

const foodReducer = (state: FoodState, action: FoodAction): FoodState => {
    switch (action.type) {
        case "FOOD_LOADING":
            return {
                ...state,
                isLoading: true,
                error: null,
            };
        case "FOOD_SUCCESS":
            return {
                ...state,
                foods: Array.isArray(action.payload.foods) ? action.payload.foods : [],
                isLoading: false,
                error: null,
            };
        case "CATEGORIES_SUCCESS":
            return {
                ...state,
                categories: Array.isArray(action.payload.categories) ? action.payload.categories : [],
                isLoading: false,
                error: null,
            };
        case "RESTAURANTS_SUCCESS":
            return {
                ...state,
                restaurants: Array.isArray(action.payload.restaurants) ? action.payload.restaurants : [],
                isLoading: false,
                error: null,
            };
        case "FEATURED_FOODS_SUCCESS":
            return {
                ...state,
                featuredFoods: Array.isArray(action.payload.featuredFoods) ? action.payload.featuredFoods : [],
                isLoading: false,
                error: null,
            };
        case "POPULAR_FOODS_SUCCESS":
            return {
                ...state,
                popularFoods: Array.isArray(action.payload.popularFoods) ? action.payload.popularFoods : [],
                isLoading: false,
                error: null,
            };
        case "FOOD_ERROR":
            return {
                ...state,
                isLoading: false,
                error: action.payload.error,
            };
        case "CLEAR_ERROR":
            return {
                ...state,
                error: null,
            };
        default:
            return state;
    }
};

const FoodContext = createContext<FoodContextType | undefined>(undefined);

interface FoodProviderProps {
    children: ReactNode;
}

export const FoodProvider: React.FC<FoodProviderProps> = ({ children }) => {
    const [state, dispatch] = useReducer(foodReducer, initialState);

    const loadAllFoods = async (params?: { category_id?: string; search?: string }) => {
        try {
            dispatch({ type: "FOOD_LOADING" });
            const response = await foodApiClient.getAllFoods(params);

            if (response.success && response.data) {
                dispatch({
                    type: "FOOD_SUCCESS",
                    payload: { foods: Array.isArray(response.data.foods) ? response.data.foods : [] },
                });

                // Chỉ cập nhật categories và restaurants nếu chúng chưa có
                if (
                    response.data.categories &&
                    Array.isArray(response.data.categories) &&
                    state.categories.length === 0
                ) {
                    dispatch({
                        type: "CATEGORIES_SUCCESS",
                        payload: { categories: response.data.categories },
                    });
                }
                if (
                    response.data.restaurants &&
                    Array.isArray(response.data.restaurants) &&
                    state.restaurants.length === 0
                ) {
                    dispatch({
                        type: "RESTAURANTS_SUCCESS",
                        payload: { restaurants: response.data.restaurants },
                    });
                }
            } else {
                dispatch({
                    type: "FOOD_ERROR",
                    payload: { error: response.message || "Không thể tải danh sách món ăn" },
                });
            }
        } catch (error) {
            dispatch({
                type: "FOOD_ERROR",
                payload: { error: "Lỗi kết nối. Vui lòng thử lại." },
            });
        }
    };

    const loadCategories = useCallback(async () => {
        try {
            dispatch({ type: "FOOD_LOADING" });
            const response = await foodApiClient.getCategories();

            if (response.success && response.data) {
                dispatch({
                    type: "CATEGORIES_SUCCESS",
                    payload: {
                        categories: Array.isArray(response.data.categories)
                            ? response.data.categories
                            : Array.isArray(response.data)
                            ? response.data
                            : [],
                    },
                });
            } else {
                dispatch({
                    type: "FOOD_ERROR",
                    payload: { error: response.message || "Không thể tải danh mục" },
                });
            }
        } catch (error) {
            dispatch({
                type: "FOOD_ERROR",
                payload: { error: "Lỗi kết nối. Vui lòng thử lại." },
            });
        }
    }, []);

    const loadRestaurants = useCallback(async () => {
        try {
            dispatch({ type: "FOOD_LOADING" });
            const response = await foodApiClient.getRestaurants({ is_active: true });

            if (response.success && response.data) {
                dispatch({
                    type: "RESTAURANTS_SUCCESS",
                    payload: {
                        restaurants: Array.isArray(response.data.restaurants)
                            ? response.data.restaurants
                            : Array.isArray(response.data)
                            ? response.data
                            : [],
                    },
                });
            } else {
                dispatch({
                    type: "FOOD_ERROR",
                    payload: { error: response.message || "Không thể tải danh sách nhà hàng" },
                });
            }
        } catch (error) {
            dispatch({
                type: "FOOD_ERROR",
                payload: { error: "Lỗi kết nối. Vui lòng thử lại." },
            });
        }
    }, []);

    const loadFeaturedFoods = async () => {
        try {
            const response = await foodApiClient.getFeaturedFoods(10);

            if (response.success && response.data) {
                dispatch({
                    type: "FEATURED_FOODS_SUCCESS",
                    payload: {
                        featuredFoods: Array.isArray(response.data) ? response.data : [],
                    },
                });
            }
        } catch (error) {
            console.error("Load featured foods error:", error);
        }
    };

    const loadPopularFoods = async () => {
        try {
            const response = await foodApiClient.getPopularFoods(10);

            if (response.success && response.data) {
                dispatch({
                    type: "POPULAR_FOODS_SUCCESS",
                    payload: {
                        popularFoods: Array.isArray(response.data) ? response.data : [],
                    },
                });
            }
        } catch (error) {
            console.error("Load popular foods error:", error);
        }
    };

    const searchFoods = async (query: string, filters?: any): Promise<FoodWithDetails[]> => {
        try {
            const response = await foodApiClient.searchFoods(query, filters);

            if (response.success && response.data) {
                return response.data;
            }
            return [];
        } catch (error) {
            console.error("Search foods error:", error);
            return [];
        }
    };

    const clearError = () => {
        dispatch({ type: "CLEAR_ERROR" });
    };

    const refreshAllData = useCallback(async () => {
        try {
            // Load all data concurrently
            await Promise.all([loadCategories(), loadFeaturedFoods(), loadPopularFoods(), loadAllFoods()]);
        } catch (error) {
            console.error("Refresh all data error:", error);
        }
    }, [loadCategories]);

    // Load initial data when component mounts
    useEffect(() => {
        loadCategories();
        loadFeaturedFoods();
        loadPopularFoods();
    }, []);

    const contextValue: FoodContextType = {
        ...state,
        loadAllFoods,
        loadCategories,
        loadRestaurants,
        loadFeaturedFoods,
        loadPopularFoods,
        searchFoods,
        clearError,
        refreshAllData,
    };

    return <FoodContext.Provider value={contextValue}>{children}</FoodContext.Provider>;
};

export const useFood = (): FoodContextType => {
    const context = useContext(FoodContext);
    if (context === undefined) {
        throw new Error("useFood must be used within a FoodProvider");
    }
    return context;
};

export default FoodContext;
