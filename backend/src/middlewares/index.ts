import helmet from "helmet";
import compression from "compression";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import morgan from "morgan";

const useMiddlewares = (app) => {
    app.use(cors({ origin: "*", credentials: true }));

    app.use(helmet());

    app.use(compression());

    app.use(express.json({ limit: "10mb" }));
    app.use(express.urlencoded({ extended: true }));
    app.use(cookieParser());

    app.use(morgan("dev"));
};

export default useMiddlewares;
