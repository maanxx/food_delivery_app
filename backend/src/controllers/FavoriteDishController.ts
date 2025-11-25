import { FavoriteDishModel } from "../models/FavoriteDish";
import { DishModel } from "../models/Dish";
import ResponseUtils from "../utils/response";

export class FavoriteDishController {
    // Lấy danh sách món yêu thích của user (trả về chi tiết món ăn)
    static async getFavorites(req, res) {
        try {
            const { user_id } = req.params;
            const favorites = await FavoriteDishModel.findByUser(user_id);
            // Lấy chi tiết món ăn cho từng favorite
            const foods = [];
            for (const fav of favorites) {
                const dish = await DishModel.findById(fav.dish_id);
                if (dish) {
                    foods.push({
                        favorite_id: fav.favorite_id,
                        added_at: fav.created_at,
                        food: {
                            id: dish.dish_id,
                            name: dish.name,
                            description: dish.description,
                            price: Number(dish.price),
                            discount_price: dish.discount_amount
                                ? Number(dish.price) - Number(dish.discount_amount)
                                : null,
                            category_id: dish.category_id,
                            image_url: dish.thumbnail_path,
                            rating: dish.points ? Number(dish.points) : 0,
                            total_reviews: dish.rate_quantity ?? 0,
                            is_available: Boolean(dish.available),
                            prep_time: dish.prep_time ?? null,
                            created_at: dish.created_at,
                            updated_at: dish.update_at ?? dish.updated_at,
                        },
                    });
                }
            }
            return ResponseUtils.success(res, "Lấy danh sách món yêu thích thành công", foods);
        } catch (err) {
            return ResponseUtils.error(res, err.message || "Lỗi server", 500);
        }
    }

    // Thêm món vào yêu thích
    static async addFavorite(req, res) {
        try {
            const { user_id, dish_id } = req.body;
            console.log("user_id, dish_id: ", user_id, dish_id);
            const favorite_id = await FavoriteDishModel.add(user_id, dish_id);
            if (favorite_id) {
                return ResponseUtils.success(res, "Đã thêm vào yêu thích", { favorite_id });
            } else {
                return ResponseUtils.error(res, "Không thể thêm vào yêu thích", 400);
            }
        } catch (err) {
            return ResponseUtils.error(res, err.message || "Lỗi server", 500);
        }
    }

    // Xóa món khỏi yêu thích
    static async removeFavorite(req, res) {
        try {
            const { user_id, dish_id } = req.body;
            const deleted = await FavoriteDishModel.remove(user_id, dish_id);
            if (deleted) {
                return ResponseUtils.success(res, "Đã xóa khỏi yêu thích", { success: true });
            } else {
                return ResponseUtils.error(res, "Favorite not found", 404);
            }
        } catch (err) {
            return ResponseUtils.error(res, err.message || "Lỗi server", 500);
        }
    }
}

export const addFavorite = async (req, res) => {
    try {
        const { user_id, dish_id } = req.body;
        const favorite = await FavoriteDish.create({
            favorite_id: uuidv4(),
            user_id,
            dish_id,
        });
        res.status(201).json(favorite);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const removeFavorite = async (req, res) => {
    try {
        const { user_id, dish_id } = req.body;
        const deleted = await FavoriteDish.destroy({ where: { user_id, dish_id } });
        if (deleted) {
            res.json({ success: true });
        } else {
            res.status(404).json({ error: "Favorite not found" });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
