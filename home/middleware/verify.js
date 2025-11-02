import jwt from "jsonwebtoken";
import { TOKEN } from "../config/index.js";
import { getPool } from "../utils/postgres.js";
import { getRedisClient } from "../utils/redis.js";
import logger from"../utils/logger.js"


export default async function Verify(req, res, next) {
    try {
        const pool = await getPool();
        const client = await getRedisClient();
        const token = req.cookies.SessionID;
        
        if (!token) {
            return res.status(401).json({
                message: "This session is invalid or has expired. Please login."
            })
        }
        const isBlacklisted = await client.exists(token);
        if (isBlacklisted){
            return res.status(401).json({
                message: "This session is invalid or has expired. Please login."
            })
        }

        let decoded;
        try {
            decoded = jwt.verify(token, TOKEN);
        } catch(err) {
            return res.status(401).json({
                message: "This session is invalid or expired.  Please login."
            })
        }

        const { id } = decoded;

        const exists = await pool.query(
            'select id, username, email, role from users where id = $1',
            [id]
        );

        if (exists.rows.length === 0){
            return res.status(401).json({
                message: "This session is invalid or expired.  Please login."
            })
        }

        const user = exists.rows[0];

        req.user = {
            id: user.id,
            email: user.email,
            username: user.username,
            role: user.role
        }
        next();
    } catch (err) {
        logger.error("Failed to verify user:", err);
        return res.status(500).json({
            message: "Internal Server Error",
        });
    }
}