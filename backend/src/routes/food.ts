import { Router } from "express";
import { FoodController } from "../controllers/FoodController";

const router = Router();

// Categories routes
router.get("/categories", FoodController.getCategories);

// Foods routes
router.get("/foods", FoodController.getAllFoods);
router.get("/foods/featured", FoodController.getFeaturedFoods);
router.get("/foods/popular", FoodController.getPopularFoods);
router.get("/foods/search", FoodController.searchFoods);
router.get("/foods/:id", FoodController.getFoodById);

// Category foods routes
router.get("/categories/:categoryId/foods", FoodController.getFoodsByCategory);

export default router;
