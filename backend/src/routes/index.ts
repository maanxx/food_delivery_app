import { Application } from "express";
import authRoutes from "./auth";
import foodRoutes from "./food";
import reviewRoutes from "./review";

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

    /* POST */
    /* PUT */
    /* DELETE */
};

export default routes;
