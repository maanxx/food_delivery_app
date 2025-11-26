import express from "express";
import { FavoriteDishController } from "../controllers/FavoriteDishController";

const router = express.Router();

// Lấy danh sách món yêu thích của user
router.get("/:user_id", FavoriteDishController.getFavorites);

// Thêm món yêu thích
router.post("/add", FavoriteDishController.addFavorite);

// Xóa món yêu thích
router.delete("/remove", FavoriteDishController.removeFavorite);

export default router;
