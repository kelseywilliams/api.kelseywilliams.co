import { createClient } from "redis";
import logger from "../utils/logger.js";
import { REDIS_URI } from "../config/index.js";

let client = null;
let connecting = null;

export const connectRedis = async () => {
  if (client?.isOpen) return client;
  if (connecting) return connecting;

  connecting = (async () => {
    client = createClient({
      url: REDIS_URI,
      socket: {
        connectTimeout: 10_000,
        reconnectStrategy: (retries) => {
          // Keep trying, with capped backoff.
          const delay = Math.min(50 * 2 ** retries, 3000);
          if (retries === 0) logger.warn("Redis reconnecting...");
          if (retries % 10 === 0) logger.warn(`Redis reconnect attempts: ${retries}`);
          return delay;
        },
      },
    });

    client.on("error", (err) => logger.error("Redis error:", err));
    client.on("connect", () => logger.info("Redis connected"));
    client.on("ready", () => logger.info("Redis ready"));
    client.on("end", () => logger.warn("Redis connection ended"));

    await client.connect();
    return client;
  })();

  try {
    return await connecting;
  } finally {
    connecting = null;
  }
};

export const getRedisClient = () => {
  if (!client) throw new Error("Redis client not initialized. Call connectRedis() first.");
  if (!client.isReady) throw new Error("Redis client not ready.");
  return client;
};

export const disconnectRedis = async () => {
  if (!client) return;

  const c = client;
  client = null;

  // Quit with timeout to avoid hanging shutdown.
  await Promise.race([
    c.quit(),
    new Promise((_, reject) => setTimeout(() => reject(new Error("Redis quit timeout")), 3000)),
  ]).catch((err) => {
    logger.warn("Redis quit failed, forcing disconnect:", err);
    try { 
        c.disconnect(); 
    } catch {
        logger.error("Unable to force Redis shutdown.", err)
    }
  });
  logger.info("Redis client disconnected");
};
