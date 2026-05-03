import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import ResponseUtils from "../utils/response";
import { authMiddleware } from "../middlewares/auth";

const router = Router();

// Ensure upload directory exists
const uploadDir = path.join(__dirname, "../../uploads");
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer storage configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    },
});

const upload = multer({
    storage,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
});

// Upload endpoint
router.post("/", authMiddleware, upload.single("file"), (req: any, res) => {
    try {
        if (!req.file) {
            return ResponseUtils.badRequest(res, "No file uploaded");
        }

        const fileUrl = `/uploads/${req.file.filename}`;
        
        ResponseUtils.success(res, "File uploaded successfully", {
            url: fileUrl,
            filename: req.file.originalname,
            size: req.file.size,
            mimetype: req.file.mimetype,
        });
    } catch (error: any) {
        console.error("Upload error:", error);
        ResponseUtils.error(res, error.message);
    }
});

export default router;
