import { Application } from "express";
import authRoutes from "./auth";

const routes = (app: Application) => {
    /* GET */
    app.get("/", (req, res) => {
        res.send("Food Delivery Backend running!");
    });

    // Auth routes
    app.use("/api/auth", authRoutes);

    /* POST */
    /* PUT */
    /* DELETE */
};

export default routes;
