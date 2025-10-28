import pg from "pg";
import logger from "../utils/logger.js";
import { POSTGRES_WORKER_URI } from "../config/index.js";

const { Pool } = pg;

let pool = null;

export const connectPool = async () => {
    if (pool) return pool;
    try {
        pool = new Pool({
            connectionString: POSTGRES_WORKER_URI,
            max: 20, // Maximum number of clients in pool
            idelTimeoutMillis: 30000,
            connectionTimeoutMillis: 2000,
        });

        // Test connection
        const client = await pool.connect();
        logger.info("PostgreSQL connected successfuly");
        client.release();

        // Handle pool errors
        pool.on("error", (err) => {
            logger.error("Unexpected pool error:", err);
        });

        return pool;
    } catch (err) {
        logger.error("Failed to connect to PostgreSQL", err);
        throw err;
    }
};

export const getPool = () => {
    if (!pool) {
        throw new Error("Database pool not initialized. Call connectDatabase() first.")
    }
    return pool;
};

export const disconnectDatabase = async () => {
    if (pool) {
        await pool.end();
        logger.info("PostgreSQL pool closed");
        pool = null;
    }
};

// Helper function for transactions
export const withTransaction = async (callback) => {
    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        const result = await callback(client);
        await client.query("COMMIT");
        return result;
    } catch (err) {
        await client.query("ROLLBACK");
        throw err;
    } finally {
        client.release();
    }
}