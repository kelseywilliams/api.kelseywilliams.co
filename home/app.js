import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { connectRedis } from "./utils/redis.js";
import { connectPool } from "./utils/postgres.js";
import { PORT } from "./config/index.js";
import Router from "./routes/index.js";
import logger from "./utils/logger.js";
//import shutdown from "./utils/shutdown.js";
const server = express();

const allowedOrigins = [
    "https://kelseywilliams.co",
    "https://www.kelseywilliams.co"
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
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
}
// CONFIGURE HEADER INFORMATION 
// Allow request from any source. In real production, this should be limited to allowed origins only
server.use(cors(corsOptions));
server.disable("x-powered-by"); // Reduce fingerprinting
server.use(cookieParser());
server.use(express.urlencoded({ extended: false }));
server.use(express.json());

// CONFIGURE ROUTES
Router(server);

let httpServer;

const startServer = async () => {
    try {
        await connectRedis();
        await connectPool();

        httpServer = server.listen(PORT, () => {
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
