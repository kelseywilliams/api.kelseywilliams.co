import jwt from "jsonwebtoken";
import { PUBLIC_KEY } from "../config/index.js";
import { getRedisClient } from "../utils/redis.js";
import { getPool } from "../utils/postgres.js";

// Same verification as VerifyValidSession, but never rejects the request -
// it just leaves req.username unset when there's no valid session.
export default async function TryVerifySession(req, res, next) {
    try {
        const client = getRedisClient();
        const pool = await getPool();
        const token = req.cookies.SessionID;

        if (!token) return next();

        const isBlacklisted = await client.exists(token);
        if (isBlacklisted) return next();

        const verify = jwt.verify(token, PUBLIC_KEY, { algorithms: ["RS256"] });

        const query = `select username from users where id = $1`;
        const exists = await pool.query(query, [verify.id]);
        if (exists.rows.length > 0) {
            req.username = exists.rows[0].username;
        }

        next();
    } catch {
        next();
    }
}
