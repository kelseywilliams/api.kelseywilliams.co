import jwt from "jsonwebtoken";
import { PUBLIC_KEY } from "../config/index.js";
import { getRedisClient } from "../utils/redis.js";
import logger from"../utils/logger.js"


export default async function VerifyValidSession(req, res, next) {
    try {
        const client = getRedisClient();
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

            req.username = verify.username;
            res.username = verify.username;

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