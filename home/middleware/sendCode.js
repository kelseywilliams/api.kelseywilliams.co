import Mailjet from 'node-mailjet';
import crypto from 'crypto';
import { getRedisClient } from '../utils/redis.js';
import { getPool } from '../utils/postgres.js';
import { MAILJET_API_KEY, MAILJET_SECRET } from '../config/index.js';
import logger from '../utils/logger.js';

const mailjet = Mailjet.apiConnect(MAILJET_API_KEY, MAILJET_SECRET);

export default async function SendCode(req, res, next) {
    try {
        const  { email } = req.body;
        if(!email) return res.status(400).json({
            
            message: "Email is required."
        });

        const code = crypto.randomInt(1000, 9999).toString();
        const client = await getRedisClient();
        const pool = getPool();
        const exists = await pool.query(
            'select * from users where email = $1',
            [email]
        )
        if(exists.rows.length > 0){
            return res.status(409).json({
                
                message: "An account with that email already exists."
            });
        }
        await client.setEx(`verify:${email}`, 300, code);

        await mailjet.post('send', { version: 'v3.1' }).request({
            Messages: [
                {
                    From: { Email: 'no-reply@kelseywilliams.co', Name: 'kelseywilliams.co'},
                    To: [{Email: email }],
                    Subject: 'Your verification code',
                    TextPart: `Your verification code is ${code}. Do not share this code with anyone.  This code will expire in 5 minutes.`
                },
            ],
        });
        next();
    } catch (err) {
        logger.error("Failed to send code:", err);
        return res.status(500).json({
            
            message: 'Internal Server Error'
        });
    }
}