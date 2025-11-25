import { Application } from "express";
import authRoutes from "./auth";
import foodRoutes from "./food";
import reviewRoutes from "./review";
import addressRoutes from "./address";
import vnpayRoutes from "./vnpay";
import favoriteRoutes from "./favorite";

const routes = (app: Application) => {
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
    app.use("/api", addressRoutes);

    // VNPAY routes
    app.use("/api/vnpay", vnpayRoutes);

    // Favorite Dishes routes
    app.use("/api/favorite", favoriteRoutes);

    /* POST */
    /* PUT */
    /* DELETE */
};

export default routes;
