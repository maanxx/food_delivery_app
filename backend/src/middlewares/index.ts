import helmet from "helmet";
import compression from "compression";
import cookieParser from "cookie-parser";
import cors from "cors";
import express, { Application } from "express";
import morgan from "morgan";

const useMiddlewares = (app: Application) => {
    app.use(
        cors({
            origin:
                process.env.NODE_ENV === "production"
                    ? ["http://localhost:3000", "https://your-frontend-domain.com"]
                    : "*",
            credentials: true,
        }),
    );

    app.use(
        helmet({
            crossOriginResourcePolicy: { policy: "cross-origin" },
        }),
    );

    app.use(compression());

    app.use(express.json({ limit: "10mb" }));
    app.use(express.urlencoded({ extended: true }));
    app.use(cookieParser());

    app.use(morgan("dev"));

    // Error handling middleware
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
        console.error("Global error handler:", err);
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: process.env.NODE_ENV === "development" ? err.message : undefined,
        });
    });
};

export default useMiddlewares;
