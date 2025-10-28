import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { connectRedis } from "./utils/redis.js";
import { connectPool } from "./utils/postgres.js";
import { PORT } from "./config/index.js";
import Router from "./routes/index.js";
import logger from "./utils/logger.js";
const server = express();

// CONFIGURE HEADER INFORMATION 
// Allow request from any source. In real production, this should be limited to allowed origins only
server.use(cors());
server.disable("x-powered-by"); // Reduce fingerprinting
server.use(cookieParser());
server.use(express.urlencoded({ extended: false }));
server.use(express.json());

// CONFIGURE ROUTES
Router(server);

const startServer = async () => {
    try {
        await connectRedis();
        await connectPool();

        server.listen(PORT, () => {
            logger.info(`Server running on port ${PORT}`);
        });
    } catch (err) {
        logger.error("Failed to start server:", err);
        process.exit(1);
    }
}

await startServer();
