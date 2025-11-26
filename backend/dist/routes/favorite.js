"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const FavoriteDishController_1 = require("../controllers/FavoriteDishController");
const router = express_1.default.Router();
// Lấy danh sách món yêu thích của user
router.get("/:user_id", FavoriteDishController_1.FavoriteDishController.getFavorites);
// Thêm món yêu thích
router.post("/add", FavoriteDishController_1.FavoriteDishController.addFavorite);
// Xóa món yêu thích
router.delete("/remove", FavoriteDishController_1.FavoriteDishController.removeFavorite);
exports.default = router;
