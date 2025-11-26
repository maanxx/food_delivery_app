"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const groq_sdk_1 = __importDefault(require("groq-sdk"));
const router = (0, express_1.Router)();
const client = new groq_sdk_1.default({
    apiKey: process.env.GROQ_API_KEY,
});
router.post("/describe-food", async (req, res) => {
    try {
        const { query } = req.body;
        if (!query) {
            return res.status(400).json({ error: "Missing query" });
        }
        const completion = await client.chat.completions.create({
            model: "llama-3.1-8b-instant",
            messages: [
                { role: "system", content: "Bạn là chuyên gia ẩm thực Việt Nam" },
                {
                    role: "user",
                    content: `Bạn là chuyên gia ẩm thực Việt Nam. Tôi sẽ hỏi bạn có thể là 1 từ hoặc nhiều từ. Công việc của bạn là mô tả món ăn cho tôi, bao gồm: hương vị, nguyên liệu, độ cay, calories, phù hợp với ai. Tôi hỏi bằng ngôn ngữ gì thì bạn trả lời bằng ngôn ngữ đó. Nếu không có câu hỏi liên quan đến ẩm thực thì từ chối lịch sự. Đừng trả lời quá dài dòng, không cần chào hỏi gì cả. Hãy vào luôn câu trả lời. Mặc định là trả lời bằng tiếng Việt, nếu câu hỏi đầy đủ là tiếng gì thì trả lời bằng tiếng đó. Đây là bắt đầu nội dung món ăn cần mô tả là: ${query}`,
                },
            ],
            temperature: 0.6,
            max_tokens: 300,
        });
        const result = completion.choices[0].message.content;
        console.log("AI Response: ", result);
        return res.json({ description: result });
    }
    catch (err) {
        console.error("Groq error:", err);
        return res.status(500).json({ error: "AI error" });
    }
});
exports.default = router;
