import logger from "../utils/logger.js";
import { getPool } from "../utils/postgres.js";
import { ADMIN } from "../config/index.js";
export default async function VerifyAdmin(req, res, next){
    try{
        const role = req.role;
        if (role != ADMIN) {
            return res.status(403).json({
                message: "Insufficient privileges."
            });  
        }
        req.admin = true;

        next();

    } catch (err) {
        logger.error("Failed to verify role:", err);
        return res.status(500).json({
            message: "Internal Server Error"
        });
    }
}