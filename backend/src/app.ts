import express from "express";

import useMiddlewares from "./middlewares/index";
import routes from "./routes/index";

const app = express();

// middlewares
useMiddlewares(app);

// routes
routes(app);

export default app;
