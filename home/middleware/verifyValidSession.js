import jwt from "jsonwebtoken";
import { PUBLIC_KEY } from "../config/index.js";
import { getRedisClient } from "../utils/redis.js";
import { getPool } from "../utils/postgres.js";
import logger from"../utils/logger.js"


export default async function VerifyValidSession(req, res, next) {
    try {
        const client = getRedisClient();
        const pool = await getPool();
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

        try {
            let verify = jwt.verify(
                token,
                PUBLIC_KEY,
                { algorithms: ["RS256"] }
            );

            let query = `select id, username, email, role from users where id = $1`
            const exists = await pool.query(query, [verify.id]);
            if (exists.rows.length == 0){
                throw Error("User no longer exists.")
            }
            const user = exists.rows[0]
            req.id = user.id;
            req.username = user.username;
            req.email = user.email;
            req.role = user.role;

            next();

        } catch(err) {
            return res.status(401).json({
                message: "This session is invalid or expired.  Please login."
            })
        }
    } catch (err) {
        logger.error("Failed to verify user:", err);
        return res.status(500).json({
            message: "Internal Server Error",
        });
    }
}