import { Application } from "express";
import authRoutes from "./auth";
import foodRoutes from "./food";
import reviewRoutes from "./review";
import addressRoutes from "./address";
import vnpayRoutes from "./vnpay";
import favoriteRoutes from "./favorite";
import invoiceRoutes from "./invoice";
import invoiceItemsRoutes from "./invoiceItems";
import openAIRoutes from "./groqAI";
import chatRoutes from "./chat";
import uploadRoutes from "./upload";
import express from "express";
import path from "path";

const routes = (app: Application) => {
    // Serve static files from uploads directory
    app.use("/uploads", express.static(path.join(__dirname, "../../uploads")));
    /* GET */
    app.get("/", (req, res) => {
        res.send("Food Delivery Backend running!");
    });

    // Auth routes
    app.use("/api/auth", authRoutes);

    // Food routes
    app.use("/api", foodRoutes);

    // Review routes
    app.use("/api", reviewRoutes);

    // Address routes
    app.use("/api/addresses", addressRoutes);

    // VNPAY routes
    app.use("/api/vnpay", vnpayRoutes);

    // Favorite Dishes routes
    app.use("/api/favorite", favoriteRoutes);

    // Invoice routes
    app.use("/api/invoice", invoiceRoutes);

    // Invoice Items routes
    app.use("/api/invoice-items", invoiceItemsRoutes);

    // OpenAI routes
    app.use("/api/ai", openAIRoutes);

    // Chat routes
    app.use("/api/conversations", chatRoutes);

    // Upload routes
    app.use("/api/upload", uploadRoutes);
};

export default routes;
