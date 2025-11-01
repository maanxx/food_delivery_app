import http from "http";
import dotenv from "dotenv";
import debugLib from "debug";
import app from "./app";
import { testConnection } from "./configs/database";

dotenv.config();

const debug = debugLib("backend:server");
const port = normalizePort(process.env.PORT || "5678");
app.set("port", port);

const server = http.createServer(app);

// Test database connection before starting server
const startServer = async () => {
    try {
        await testConnection();
        server.listen(port, () => {
            console.log(`✅ Server listening at http://localhost:${port}`);
        });
    } catch {
        console.error("❌ Failed to connect to database. Server not started.");
        process.exit(1);
    }
};

startServer();
server.on("error", onError);
server.on("listening", onListening);

function normalizePort(val: string) {
    const port = parseInt(val, 10);
    if (isNaN(port)) return val;
    if (port >= 0) return port;
    return false;
}

function onError(error: NodeJS.ErrnoException) {
    if (error.syscall !== "listen") throw error;
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
