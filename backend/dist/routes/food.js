"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const FoodController_1 = require("../controllers/FoodController");
const router = (0, express_1.Router)();
// Categories routes
router.get("/categories", FoodController_1.FoodController.getCategories);
// Foods routes
router.get("/foods", FoodController_1.FoodController.getAllFoods);
router.get("/foods/featured", FoodController_1.FoodController.getFeaturedFoods);
router.get("/foods/popular", FoodController_1.FoodController.getPopularFoods);
router.get("/foods/search", FoodController_1.FoodController.searchFoods);
router.get("/foods/:id", FoodController_1.FoodController.getFoodById);
// Category foods routes
router.get("/categories/:categoryId/foods", FoodController_1.FoodController.getFoodsByCategory);
exports.default = router;
