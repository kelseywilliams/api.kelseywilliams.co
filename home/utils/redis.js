import { createClient } from "redis";
import logger from "../utils/logger.js";
import { REDIS_URI } from "../config/index.js";

let client = null;

export const connectRedis = async () => {
    if(client) return client;
    try {
        client  = createClient({
            url: REDIS_URI,
            socket: {
                reconnectStrategy: (retries) => {
                    if (retries > 10) {
                        logger.error("Redis connection failed after 10 retries");
                        return new Error("Redis connection failed");
                    }
                    return Math.min(retries*100, 3000);
                }
            }
        });

        client.on("error", (err) => logger.error("Redis Client Error:", err));
        client.on("connect", () => logger.info("Redis connected"));
        client.on("reconnecting", () => logger.warn("Redis reconnecting..."));

        await client.connect();
        return client;
    } catch(err) {
        logger.error("Failed to connect to Redis:", err);
        throw err;
    }
};

export const getRedisClient = () => {
    if(!client) {
        throw new Error("Redis client not initialized. Call connectRedis() first.");
    }
    return client;
}

export const disconnectRedis = async () => {
    if(client) {
        await client.quit();
        client = null;
    }
}