import { Request, Response } from "express";
import { ResponseUtils } from "../utils/response";

// Mock data for now - trong thực tế sẽ lấy từ database
const mockCategories = [
    {
        id: "1",
        name: "Burgers",
        description: "Các loại burger ngon",
        image_url: null,
        is_active: true,
        sort_order: 1,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
    },
    {
        id: "2",
        name: "Pizza",
        description: "Pizza Ý thơm ngon",
        image_url: null,
        is_active: true,
        sort_order: 2,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
    },
    {
        id: "3",
        name: "Nước uống",
        description: "Thức uống giải khát",
        image_url: null,
        is_active: true,
        sort_order: 3,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
    },
    {
        id: "4",
        name: "Khai vị",
        description: "Món khai vị ngon miệng",
        image_url: null,
        is_active: true,
        sort_order: 4,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
    },
];

const mockRestaurants = [
    {
        id: "1",
        name: "Burger King",
        description: "Chuỗi burger nổi tiếng",
        address: "123 Nguyễn Huệ, Q.1, TP.HCM",
        phone: "0901234567",
        email: "contact@burgerking.com",
        image_url: null,
        rating: 4.5,
        total_reviews: 1250,
        is_active: true,
        delivery_fee: 15000,
        min_order: 50000,
        delivery_time: "20-30 phút",
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
    },
    {
        id: "2",
        name: "Pizza Hut",
        description: "Pizza phong cách Mỹ",
        address: "456 Lê Lợi, Q.1, TP.HCM",
        phone: "0907654321",
        email: "info@pizzahut.com",
        image_url: null,
        rating: 4.3,
        total_reviews: 890,
        is_active: true,
        delivery_fee: 20000,
        min_order: 80000,
        delivery_time: "25-35 phút",
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
    },
];

const mockFoods = [
    {
        id: "1",
        name: "Whopper Burger",
        description: "Burger bò nướng với rau xanh tươi",
        price: 85000,
        discount_price: 95000,
        category_id: "1",
        restaurant_id: "1",
        image_url: "https://images.unsplash.com/photo-1550547660-d9450f859349?w=400&h=300&fit=crop",
        rating: 4.8,
        total_reviews: 324,
        is_available: true,
        prep_time: 15,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
    },
    {
        id: "2",
        name: "Cheeseburger Deluxe",
        description: "Burger phô mai đặc biệt với thịt bò Angus",
        price: 95000,
        discount_price: null,
        category_id: "1",
        restaurant_id: "1",
        image_url: "https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=400&h=300&fit=crop",
        rating: 4.6,
        total_reviews: 256,
        is_available: true,
        prep_time: 18,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
    },
    {
        id: "3",
        name: "Pizza Margherita",
        description: "Pizza cổ điển với cà chua, phô mai mozzarella",
        price: 120000,
        discount_price: 135000,
        category_id: "2",
        restaurant_id: "2",
        image_url: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400&h=300&fit=crop",
        rating: 4.7,
        total_reviews: 445,
        is_available: true,
        prep_time: 25,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
    },
    {
        id: "4",
        name: "Pizza Pepperoni",
        description: "Pizza với xúc xích pepperoni thơm ngon",
        price: 145000,
        discount_price: null,
        category_id: "2",
        restaurant_id: "2",
        image_url: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&h=300&fit=crop",
        rating: 4.9,
        total_reviews: 378,
        is_available: true,
        prep_time: 30,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
    },
    {
        id: "5",
        name: "Coca Cola",
        description: "Nước ngọt có ga mát lạnh",
        price: 25000,
        discount_price: null,
        category_id: "3",
        restaurant_id: "1",
        image_url: "https://images.unsplash.com/photo-1554866585-cd94860890b7?w=400&h=300&fit=crop",
        rating: 4.2,
        total_reviews: 152,
        is_available: true,
        prep_time: 2,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
    },
    {
        id: "6",
        name: "Khoai tây chiên",
        description: "Khoai tây chiên giòn rụm",
        price: 35000,
        discount_price: 40000,
        category_id: "4",
        restaurant_id: "1",
        image_url: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&h=300&fit=crop",
        rating: 4.4,
        total_reviews: 198,
        is_available: true,
        prep_time: 8,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
    },
];

export class FoodController {
    // Lấy tất cả categories
    static async getCategories(req: Request, res: Response) {
        try {
            const categories = mockCategories.filter((cat) => cat.is_active);

            return ResponseUtils.success(res, "Lấy danh mục thành công", {
                categories,
            });
        } catch (error) {
            console.error("Get categories error:", error);
            return ResponseUtils.error(res, "Lỗi server", 500);
        }
    }

    // Lấy tất cả restaurants
    static async getRestaurants(req: Request, res: Response) {
        try {
            const { is_active, page = 1, limit = 10 } = req.query;

            let restaurants = mockRestaurants;

            if (is_active !== undefined) {
                restaurants = restaurants.filter((r) => r.is_active === (is_active === "true"));
            }

            return ResponseUtils.success(res, "Lấy danh sách nhà hàng thành công", {
                restaurants,
            });
        } catch (error) {
            console.error("Get restaurants error:", error);
            return ResponseUtils.error(res, "Lỗi server", 500);
        }
    }

    // Lấy tất cả foods với filters
    static async getAllFoods(req: Request, res: Response) {
        try {
            const { category_id, restaurant_id, search, page = 1, limit = 20 } = req.query;

            let foods = mockFoods.filter((food) => food.is_available);

            // Filter by category
            if (category_id && category_id !== "All") {
                foods = foods.filter((food) => food.category_id === category_id);
            }

            // Filter by restaurant
            if (restaurant_id) {
                foods = foods.filter((food) => food.restaurant_id === restaurant_id);
            }

            // Search by name
            if (search) {
                const searchTerm = (search as string).toLowerCase();
                foods = foods.filter(
                    (food) =>
                        food.name.toLowerCase().includes(searchTerm) ||
                        food.description.toLowerCase().includes(searchTerm),
                );
            }

            // Add category and restaurant details
            const foodsWithDetails = foods.map((food) => ({
                ...food,
                category: mockCategories.find((cat) => cat.id === food.category_id),
                restaurant: mockRestaurants.find((rest) => rest.id === food.restaurant_id),
            }));

            return ResponseUtils.success(res, "Lấy danh sách món ăn thành công", {
                foods: foodsWithDetails,
                categories: mockCategories,
                restaurants: mockRestaurants,
                pagination: {
                    page: parseInt(page as string),
                    limit: parseInt(limit as string),
                    total: foods.length,
                    totalPages: Math.ceil(foods.length / parseInt(limit as string)),
                },
            });
        } catch (error) {
            console.error("Get foods error:", error);
            return ResponseUtils.error(res, "Lỗi server", 500);
        }
    }

    // Lấy food theo ID
    static async getFoodById(req: Request, res: Response) {
        try {
            const { id } = req.params;

            const food = mockFoods.find((f) => f.id === id);
            if (!food) {
                return ResponseUtils.error(res, "Không tìm thấy món ăn", 404);
            }

            const foodWithDetails = {
                ...food,
                category: mockCategories.find((cat) => cat.id === food.category_id),
                restaurant: mockRestaurants.find((rest) => rest.id === food.restaurant_id),
            };

            return ResponseUtils.success(res, "Lấy thông tin món ăn thành công", foodWithDetails);
        } catch (error) {
            console.error("Get food by id error:", error);
            return ResponseUtils.error(res, "Lỗi server", 500);
        }
    }

    // Lấy featured foods
    static async getFeaturedFoods(req: Request, res: Response) {
        try {
            const { limit = 10 } = req.query;

            // Lấy foods có rating cao và có discount
            const featuredFoods = mockFoods
                .filter((food) => food.is_available && (food.rating >= 4.5 || food.discount_price))
                .slice(0, parseInt(limit as string))
                .map((food) => ({
                    ...food,
                    category: mockCategories.find((cat) => cat.id === food.category_id),
                    restaurant: mockRestaurants.find((rest) => rest.id === food.restaurant_id),
                }));

            return ResponseUtils.success(res, "Lấy món nổi bật thành công", featuredFoods);
        } catch (error) {
            console.error("Get featured foods error:", error);
            return ResponseUtils.error(res, "Lỗi server", 500);
        }
    }

    // Lấy popular foods
    static async getPopularFoods(req: Request, res: Response) {
        try {
            const { limit = 10 } = req.query;

            // Lấy foods có nhiều review nhất
            const popularFoods = mockFoods
                .filter((food) => food.is_available)
                .sort((a, b) => b.total_reviews - a.total_reviews)
                .slice(0, parseInt(limit as string))
                .map((food) => ({
                    ...food,
                    category: mockCategories.find((cat) => cat.id === food.category_id),
                    restaurant: mockRestaurants.find((rest) => rest.id === food.restaurant_id),
                }));

            return ResponseUtils.success(res, "Lấy món phổ biến thành công", popularFoods);
        } catch (error) {
            console.error("Get popular foods error:", error);
            return ResponseUtils.error(res, "Lỗi server", 500);
        }
    }

    // Search foods
    static async searchFoods(req: Request, res: Response) {
        try {
            const { search, category_id, min_price, max_price, rating } = req.query;

            if (!search) {
                return ResponseUtils.error(res, "Vui lòng nhập từ khóa tìm kiếm", 400);
            }

            let foods = mockFoods.filter((food) => food.is_available);

            // Search by name and description
            const searchTerm = (search as string).toLowerCase();
            foods = foods.filter(
                (food) =>
                    food.name.toLowerCase().includes(searchTerm) || food.description.toLowerCase().includes(searchTerm),
            );

            // Apply filters
            if (category_id) {
                foods = foods.filter((food) => food.category_id === category_id);
            }

            if (min_price) {
                foods = foods.filter((food) => food.price >= parseInt(min_price as string));
            }

            if (max_price) {
                foods = foods.filter((food) => food.price <= parseInt(max_price as string));
            }

            if (rating) {
                foods = foods.filter((food) => food.rating >= parseFloat(rating as string));
            }

            const foodsWithDetails = foods.map((food) => ({
                ...food,
                category: mockCategories.find((cat) => cat.id === food.category_id),
                restaurant: mockRestaurants.find((rest) => rest.id === food.restaurant_id),
            }));

            return ResponseUtils.success(res, "Tìm kiếm thành công", foodsWithDetails);
        } catch (error) {
            console.error("Search foods error:", error);
            return ResponseUtils.error(res, "Lỗi server", 500);
        }
    }

    // Lấy foods theo category
    static async getFoodsByCategory(req: Request, res: Response) {
        try {
            const { categoryId } = req.params;
            const { page = 1, limit = 20 } = req.query;

            const category = mockCategories.find((cat) => cat.id === categoryId);
            if (!category) {
                return ResponseUtils.error(res, "Không tìm thấy danh mục", 404);
            }

            const foods = mockFoods
                .filter((food) => food.is_available && food.category_id === categoryId)
                .map((food) => ({
                    ...food,
                    category: mockCategories.find((cat) => cat.id === food.category_id),
                    restaurant: mockRestaurants.find((rest) => rest.id === food.restaurant_id),
                }));

            return ResponseUtils.success(res, "Lấy món ăn theo danh mục thành công", foods);
        } catch (error) {
            console.error("Get foods by category error:", error);
            return ResponseUtils.error(res, "Lỗi server", 500);
        }
    }
}
