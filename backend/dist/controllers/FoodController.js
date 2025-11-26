"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FoodController = void 0;
const response_1 = __importDefault(require("../utils/response"));
const Category_1 = require("../models/Category");
const Dish_1 = require("../models/Dish");
class FoodController {
    // Lấy tất cả categories (từ DB)
    static async getCategories(req, res) {
        try {
            const categories = await Category_1.CategoryModel.findAll();
            return response_1.default.success(res, "Lấy danh mục thành công", { categories });
        }
        catch (error) {
            console.error("Get categories error:", error);
            return response_1.default.error(res, "Lỗi server", 500);
        }
    }
    static async getAllFoods(req, res) {
        try {
            const { limit } = req.query;
            const limitNum = Math.max(1, parseInt(String(limit), 10) || 0);
            let dishes = await Dish_1.DishModel.list();
            const categories = await Category_1.CategoryModel.findAll();
            const catMap = new Map(categories.map((c) => [c.category_id, c]));
            const foodsWithDetails = dishes.map((d) => ({
                id: d.dish_id,
                name: d.name,
                description: d.description,
                price: Number(d.price),
                discount_price: d.discount_amount ? Number(d.price) - Number(d.discount_amount) : null,
                category_id: d.category_id,
                image_url: d.thumbnail_path,
                rating: d.points ? Number(d.points) : 0,
                total_reviews: d.rate_quantity ?? 0,
                is_available: Boolean(d.available),
                prep_time: d.prep_time ?? null,
                created_at: d.created_at,
                updated_at: d.update_at ?? d.updated_at,
                category: catMap.get(d.category_id) || null,
            }));
            const total = foodsWithDetails.length;
            const totalPages = Math.ceil(total / limitNum);
            console.log("getAllFoods - foodsWithDetails.length:", total);
            return response_1.default.success(res, "Lấy danh sách món ăn thành công", {
                foods: foodsWithDetails,
                categories,
                pagination: {
                    limit: limitNum,
                    total,
                    totalPages,
                },
            });
        }
        catch (error) {
            console.error("Get foods error:", error);
            return response_1.default.error(res, "Lỗi server", 500);
        }
    }
    // Lấy food theo ID
    static async getFoodById(req, res) {
        try {
            const { id } = req.params;
            const food = await Dish_1.DishModel.findById(id);
            if (!food)
                return response_1.default.error(res, "Không tìm thấy món ăn", 404);
            const category = await Category_1.CategoryModel.findById(food.category_id);
            const foodWithDetails = {
                id: food.dish_id,
                name: food.name,
                description: food.description,
                price: Number(food.price),
                discount_price: food.discount_amount ? Number(food.price) - Number(food.discount_amount) : null,
                category_id: food.category_id,
                image_url: food.thumbnail_path,
                rating: food.points ? Number(food.points) : 0,
                total_reviews: food.rate_quantity ?? 0,
                is_available: Boolean(food.available),
                prep_time: food.prep_time ?? null,
                created_at: food.created_at,
                updated_at: food.update_at ?? food.updated_at,
                category,
            };
            return response_1.default.success(res, "Lấy thông tin món ăn thành công", foodWithDetails);
        }
        catch (error) {
            console.error("Get food by id error:", error);
            return response_1.default.error(res, "Lỗi server", 500);
        }
    }
    // Lấy featured foods
    static async getFeaturedFoods(req, res) {
        try {
            const { limit = 10 } = req.query;
            // Lấy một lô món (có thể mở rộng truy vấn ở model)
            const dishes = await Dish_1.DishModel.list(100, 0); // lấy trước 100 để lọc
            const featured = dishes
                .filter((d) => Boolean(d.available) && (Number(d.points ?? 0) >= 4.5 || Number(d.discount_amount ?? 0) > 0))
                .slice(0, parseInt(String(limit), 10))
                .map((d) => ({
                id: d.dish_id,
                name: d.name,
                description: d.description,
                price: Number(d.price),
                discount_price: d.discount_amount ? Number(d.price) - Number(d.discount_amount) : null,
                category_id: d.category_id,
                image_url: d.thumbnail_path,
                rating: d.points ? Number(d.points) : 0,
                total_reviews: d.rate_quantity ?? 0,
                is_available: Boolean(d.available),
                category: null,
                restaurant: null,
            }));
            return response_1.default.success(res, "Lấy món nổi bật thành công", featured);
        }
        catch (error) {
            console.error("Get featured foods error:", error);
            return response_1.default.error(res, "Lỗi server", 500);
        }
    }
    // Lấy popular foods
    static async getPopularFoods(req, res) {
        try {
            const { limit = 10 } = req.query;
            const dishes = await Dish_1.DishModel.list(100, 0);
            const popular = dishes
                .filter((d) => Boolean(d.available))
                .sort((a, b) => (b.rate_quantity ?? 0) - (a.rate_quantity ?? 0))
                .slice(0, parseInt(String(limit), 10))
                .map((d) => ({
                id: d.dish_id,
                name: d.name,
                description: d.description,
                price: Number(d.price),
                discount_price: d.discount_amount ? Number(d.price) - Number(d.discount_amount) : null,
                category_id: d.category_id,
                image_url: d.thumbnail_path,
                rating: d.points ? Number(d.points) : 0,
                total_reviews: d.rate_quantity ?? 0,
                is_available: Boolean(d.available),
                category: null,
                restaurant: null,
            }));
            return response_1.default.success(res, "Lấy món phổ biến thành công", popular);
        }
        catch (error) {
            console.error("Get popular foods error:", error);
            return response_1.default.error(res, "Lỗi server", 500);
        }
    }
    // Search foods
    static async searchFoods(req, res) {
        try {
            const { search, category_id, min_price, max_price, rating } = req.query;
            if (!search)
                return response_1.default.error(res, "Vui lòng nhập từ khóa tìm kiếm", 400);
            // Lấy danh sách món để lọc (có thể tối ưu bằng query SQL trong model)
            const dishes = await Dish_1.DishModel.list(200, 0);
            let results = dishes.filter((d) => Boolean(d.available));
            const term = String(search).toLowerCase();
            results = results.filter((d) => String(d.name || "")
                .toLowerCase()
                .includes(term) ||
                String(d.description || "")
                    .toLowerCase()
                    .includes(term));
            if (category_id) {
                results = results.filter((d) => d.category_id === String(category_id));
            }
            if (min_price) {
                results = results.filter((d) => Number(d.price) >= Number(min_price));
            }
            if (max_price) {
                results = results.filter((d) => Number(d.price) <= Number(max_price));
            }
            if (rating) {
                results = results.filter((d) => Number(d.points ?? 0) >= Number(rating));
            }
            const categories = await Category_1.CategoryModel.findAll();
            const catMap = new Map(categories.map((c) => [c.category_id, c]));
            const foodsWithDetails = results.map((d) => ({
                id: d.dish_id,
                name: d.name,
                description: d.description,
                price: Number(d.price),
                discount_price: d.discount_amount ? Number(d.price) - Number(d.discount_amount) : null,
                category_id: d.category_id,
                image_url: d.thumbnail_path,
                rating: d.points ? Number(d.points) : 0,
                total_reviews: d.rate_quantity ?? 0,
                is_available: Boolean(d.available),
                category: catMap.get(d.category_id) || null,
                restaurant: null,
            }));
            return response_1.default.success(res, "Tìm kiếm thành công", foodsWithDetails);
        }
        catch (error) {
            console.error("Search foods error:", error);
            return response_1.default.error(res, "Lỗi server", 500);
        }
    }
    // Lấy foods theo category
    static async getFoodsByCategory(req, res) {
        try {
            // Debug: show params for this route
            try {
                console.log("getFoodsByCategory called - params:", req.params);
            }
            catch (e) {
                console.error("Error logging getFoodsByCategory params", e);
            }
            const { categoryId } = req.params;
            const { page = 1, limit = 20 } = req.query;
            const cat = await Category_1.CategoryModel.findById(categoryId);
            if (!cat)
                return response_1.default.error(res, "Không tìm thấy danh mục", 404);
            const dishes = await Dish_1.DishModel.findByCategory(categoryId);
            const foods = dishes.map((d) => ({
                id: d.dish_id,
                name: d.name,
                description: d.description,
                price: Number(d.price),
                discount_price: d.discount_amount ? Number(d.price) - Number(d.discount_amount) : null,
                category_id: d.category_id,
                image_url: d.thumbnail_path,
                rating: d.points ? Number(d.points) : 0,
                total_reviews: d.rate_quantity ?? 0,
                is_available: Boolean(d.available),
                category: cat,
                restaurant: null,
            }));
            console.log(`Dish by category id ${cat.category_id}: ${dishes.length} items`);
            return response_1.default.success(res, "Lấy món ăn theo danh mục thành công", foods);
        }
        catch (error) {
            console.error("Get foods by category error:", error);
            return response_1.default.error(res, "Lỗi server", 500);
        }
    }
}
exports.FoodController = FoodController;
