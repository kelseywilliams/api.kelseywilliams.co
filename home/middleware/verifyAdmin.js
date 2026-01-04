import logger from "../utils/logger.js";
import { getPool } from "../utils/postgres.js";
import { ADMIN } from "../config/index.js";
export default async function VerifyAdmin(req, res, next){
    try{
        const pool = await getPool();
        const username = req.username;
        let query = 'select role from users where username = $1';
        const exists = await pool.query(query, [username]);
        if (exists?.rows.length == 0){
            throw Error(`Could not select role where username = ${username}`);
        } else {
            const obj = exists.rows[0];
            const role = obj.role;
            req.admin = true;
            
            if (role != ADMIN) {
                return res.status(403).json({
                    message: "Insufficient privileges."
                });
            }   
        }

        next();

    } catch (err) {
        logger.error("Failed to verify role:", err);
        return res.status(500).json({
            message: "Internal Server Error"
        });
    }
}