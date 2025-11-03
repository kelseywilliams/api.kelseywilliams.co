import { getRedisClient } from '../utils/redis.js';
import logger from '../utils/logger.js';
export default async function CheckRecovery(req, res, next){
    try {
        const  { email, password, code } = req.body;
        if (!email || !password || !code) return res.status(400).json({
            message: "Must have email, password, and code",
        });
        const client = await getRedisClient();
        const storedCode = await client.get(`recovery:${email}`);
        if (storedCode !== code) {
            return res.status(401).json({
                message: "Invalid or expired verification code"
            });
        }
        client.del(`recovery:${email}`);
        next();
    } catch(err) {
        logger.error("Failed to verify code:", err);
        return res.status(500).json({
            message: 'Internal Server Error'
        });
    }
}