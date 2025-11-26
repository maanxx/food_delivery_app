"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = __importDefault(require("http"));
const dotenv_1 = __importDefault(require("dotenv"));
const debug_1 = __importDefault(require("debug"));
const app_1 = __importDefault(require("./app"));
const database_1 = require("./configs/database");
dotenv_1.default.config();
const debug = (0, debug_1.default)("backend:server");
const port = normalizePort(process.env.PORT || "5678");
app_1.default.set("port", port);
const server = http_1.default.createServer(app_1.default);
// Test database connection before starting server
const startServer = async () => {
    try {
        await (0, database_1.testConnection)();
        server.listen(port, () => {
            console.log(`✅ Server listening at http://localhost:${port}`);
        });
    }
    catch {
        console.error("❌ Failed to connect to database. Server not started.");
        process.exit(1);
    }
};
startServer();
server.on("error", onError);
server.on("listening", onListening);
function normalizePort(val) {
    const port = parseInt(val, 10);
    if (isNaN(port))
        return val;
    if (port >= 0)
        return port;
    return false;
}
function onError(error) {
    if (error.syscall !== "listen")
        throw error;
    const bind = typeof port === "string" ? "Pipe " + port : "Port " + port;
    switch (error.code) {
        case "EACCES":
            console.error(bind + " requires elevated privileges");
            process.exit(1);
            break;
        case "EADDRINUSE":
            console.error(bind + " is already in use");
            process.exit(1);
            break;
        default:
            throw error;
    }
}
function onListening() {
    const addr = server.address();
    const bind = typeof addr === "string" ? "pipe " + addr : "port " + (addr?.port || port);
    debug("Listening on " + bind);
}
