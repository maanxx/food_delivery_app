import { Application } from "express";
import authRoutes from "./auth";
import foodRoutes from "./food";

const routes = (app: Application) => {
    /* GET */
    app.get("/", (req, res) => {
        res.send("Food Delivery Backend running!");
    });

    // Auth routes
    app.use("/api/auth", authRoutes);

    // Food routes
    app.use("/api", foodRoutes);

    /* POST */
    /* PUT */
    /* DELETE */
};

export default routes;
