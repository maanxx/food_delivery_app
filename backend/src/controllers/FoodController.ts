import { Request, Response } from "express";
import ResponseUtils from "../utils/response";
import { CategoryModel } from "../models/Category";
import { DishModel } from "../models/Dish";

export class FoodController {
    // Lấy tất cả categories (từ DB)
    static async getCategories(req: Request, res: Response) {
        try {
            const categories = await CategoryModel.findAll();
            return ResponseUtils.success(res, "Lấy danh mục thành công", { categories });
        } catch (error) {
            console.error("Get categories error:", error);
            return ResponseUtils.error(res, "Lỗi server", 500);
        }
    }

    static async getAllFoods(req: Request, res: Response) {
        try {
            const { limit } = req.query;

            const limitNum = Math.max(1, parseInt(String(limit), 10) || 0);

            let dishes: any[] = await DishModel.list();

            const categories = await CategoryModel.findAll();
            const catMap = new Map(categories.map((c: any) => [c.category_id, c]));

            const foodsWithDetails = dishes.map((d: any) => ({
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

            return ResponseUtils.success(res, "Lấy danh sách món ăn thành công", {
                foods: foodsWithDetails,
                categories,
                pagination: {
                    limit: limitNum,
                    total,
                    totalPages,
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
            const food = await DishModel.findById(id);
            if (!food) return ResponseUtils.error(res, "Không tìm thấy món ăn", 404);

            const category = await CategoryModel.findById(food.category_id);

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
            // Lấy một lô món (có thể mở rộng truy vấn ở model)
            const dishes = await DishModel.list(100, 0); // lấy trước 100 để lọc
            const featured = dishes
                .filter(
                    (d: any) =>
                        Boolean(d.available) && (Number(d.points ?? 0) >= 4.5 || Number(d.discount_amount ?? 0) > 0),
                )
                .slice(0, parseInt(String(limit), 10))
                .map((d: any) => ({
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

            return ResponseUtils.success(res, "Lấy món nổi bật thành công", featured);
        } catch (error) {
            console.error("Get featured foods error:", error);
            return ResponseUtils.error(res, "Lỗi server", 500);
        }
    }

    // Lấy popular foods
    static async getPopularFoods(req: Request, res: Response) {
        try {
            const { limit = 10 } = req.query;
            const dishes = await DishModel.list(100, 0);
            const popular = dishes
                .filter((d: any) => Boolean(d.available))
                .sort((a: any, b: any) => (b.rate_quantity ?? 0) - (a.rate_quantity ?? 0))
                .slice(0, parseInt(String(limit), 10))
                .map((d: any) => ({
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

            return ResponseUtils.success(res, "Lấy món phổ biến thành công", popular);
        } catch (error) {
            console.error("Get popular foods error:", error);
            return ResponseUtils.error(res, "Lỗi server", 500);
        }
    }

    // Search foods
    static async searchFoods(req: Request, res: Response) {
        try {
            const { search, category_id, min_price, max_price, rating } = req.query;

            if (!search) return ResponseUtils.error(res, "Vui lòng nhập từ khóa tìm kiếm", 400);

            // Lấy danh sách món để lọc (có thể tối ưu bằng query SQL trong model)
            const dishes = await DishModel.list(200, 0);
            let results = dishes.filter((d: any) => Boolean(d.available));

            const term = String(search).toLowerCase();
            results = results.filter(
                (d: any) =>
                    String(d.name || "")
                        .toLowerCase()
                        .includes(term) ||
                    String(d.description || "")
                        .toLowerCase()
                        .includes(term),
            );

            if (category_id) {
                results = results.filter((d: any) => d.category_id === String(category_id));
            }
            if (min_price) {
                results = results.filter((d: any) => Number(d.price) >= Number(min_price));
            }
            if (max_price) {
                results = results.filter((d: any) => Number(d.price) <= Number(max_price));
            }
            if (rating) {
                results = results.filter((d: any) => Number(d.points ?? 0) >= Number(rating));
            }

            const categories = await CategoryModel.findAll();
            const catMap = new Map(categories.map((c: any) => [c.category_id, c]));

            const foodsWithDetails = results.map((d: any) => ({
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

            return ResponseUtils.success(res, "Tìm kiếm thành công", foodsWithDetails);
        } catch (error) {
            console.error("Search foods error:", error);
            return ResponseUtils.error(res, "Lỗi server", 500);
        }
    }

    // Lấy foods theo category
    static async getFoodsByCategory(req: Request, res: Response) {
        try {
            // Debug: show params for this route
            try {
                console.log("getFoodsByCategory called - params:", req.params);
            } catch (e) {
                console.error("Error logging getFoodsByCategory params", e);
            }
            const { categoryId } = req.params;
            const { page = 1, limit = 20 } = req.query;

            const cat = await CategoryModel.findById(categoryId);
            if (!cat) return ResponseUtils.error(res, "Không tìm thấy danh mục", 404);

            const dishes = await DishModel.findByCategory(categoryId);

            const foods = dishes.map((d: any) => ({
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

            return ResponseUtils.success(res, "Lấy món ăn theo danh mục thành công", foods);
        } catch (error) {
            console.error("Get foods by category error:", error);
            return ResponseUtils.error(res, "Lỗi server", 500);
        }
    }
}
