import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { connectRedis, getRedisClient } from "./utils/redis.js";
import { connectPool, getPool } from "./utils/postgres.js";
import { PORT } from "./config/index.js";
import Router from "./routes/index.js";
import logger from "./utils/logger.js";
//import shutdown from "./utils/shutdown.js";
const server = express();

const allowedOrigins = [
    "https://kelseywilliams.co",
    "https://www.kelseywilliams.co",
    // "http://localhost:3029",
    // "http://chat:3029",
    // "http://chat",
    "http://localhost",
    "http://proxy:80"
]

const corsOptions = {
    origin : (origin, cb) => {
        if (!origin || allowedOrigins.includes(origin)) {
            cb(null, true);
        } else {
            cb(new Error("Not allowed by CORS"));
        }
    },
    credentials: true,
    methods: ["GET", "POST", "OPTIONS", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
}
// CONFIGURE HEADER INFORMATION 
// Allow request from any source. In real production, this should be limited to allowed origins only
server.use(cors(corsOptions));
server.disable("x-powered-by"); // Reduce fingerprinting
server.use(cookieParser());
server.use(express.urlencoded({ extended: false }));
server.use(express.json());

// HEALTH ENDPOINTS (k8s probes; no auth)
// Liveness: is the process up and the event loop responsive? Keep it dependency-free so a
// transient Redis/Postgres blip can't fail liveness and trigger a pod restart loop.
server.get("/healthz", (req, res) => {
    res.status(200).json({ status: "ok" });
});

// Readiness: should this pod receive traffic? Verify Redis + Postgres are actually usable.
server.get("/readyz", async (req, res) => {
    try {
        // EXISTS is in the app's least-privilege Redis ACL (del/setex/exists/get) and round-trips
        // to the server, unlike PING which would NOPERM under that documented ACL. The key need
        // not exist — a 0 reply still proves Redis is reachable and the command is authorized.
        await getRedisClient().exists("readyz:probe");
        await getPool().query("SELECT 1");
        res.status(200).json({ status: "ready" });
    } catch (err) {
        logger.warn("Readiness check failed:", err);
        res.status(503).json({ status: "not ready" });
    }
});

Router(server);

let httpServer;

const startServer = async () => {
    try {
        await connectRedis();
        await connectPool();

        httpServer = server.listen(PORT, (PORT) => {
            logger.info(`Server running on port ${PORT}`);
        });
    } catch (err) {
        logger.error("Failed to start server:", err);
        process.exit(1);
    }
}

// process.on("SIGINT", () => shutdown(httpServer, "SIGINT"));
// process.on("SIGTERM", () => shutdown(httpServer, "SIGTERM"));

// process.on("uncaughtException", async (err) => {
//     logger.error(err);
//     await shutdown(httpServer, "uncaughtException")
// })

// process.on("unhandledRejection", async (reason) => {
//     logger.error(reason);
//     await shutdown(httpServer, "unhandledRejection");
// })

await startServer();
