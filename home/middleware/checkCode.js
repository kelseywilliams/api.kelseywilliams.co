import { getRedisClient } from '../utils/redis.js';
import logger from '../utils/logger.js';
export default async function CheckCode(req, res, next){
    try {
        const  { email, code } = req.body;
        if (!email || !code) return res.status(400).json({
            message: "Missing email or code",
        });
        const client = await getRedisClient();
        const storedCode = await client.get(`verify:${email}`);
        if (storedCode !== code) {
            return res.status(401).json({
                message: "Invalid or expired verification code"
            });
        }
        client.del(`verify:${email}`);
        next();
    } catch(err) {
        logger.error("Failed to verify code:", err);
        return res.status(500).json({
            message: 'Internal Server Error'
        });
    }
}