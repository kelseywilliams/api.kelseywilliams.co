import Mailjet from 'node-mailjet';
import crypto from 'crypto';
import { getRedisClient } from '../utils/redis.js';
import { MAILJET_API_KEY, MAILJET_SECRET } from '../config/index.js';
import logger from '../utils/logger.js';

const mailjet = Mailjet.apiConnect(MAILJET_API_KEY, MAILJET_SECRET);

export default async function SendCode(req, res, next) {
    try {
        const  { email } = req.body;
        if(!email) return res.status(400).json({
            status: false,
            message: "Email is required."
        });

        const code = crypto.randomInt(1000, 9999).toString();
        const client = await getRedisClient();
        await client.setEx(`verify:${email}`, 300, code);

        await mailjet.post('send', { version: 'v3.1' }).request({
            Messages: [
                {
                    From: { Email: 'no-reply@kelseywilliams.co', Name: 'Auth System'},
                    To: [{Email: email }],
                    Subject: 'Your verification code',
                    TextPart: `Your verification code for kelseywilliams.co is ${code}. Do not share this code with anyone.`
                },
            ],
        });
        next();
    } catch (err) {
        logger.error("Failed to send code:", err);
        return res.status(500).json({
            status: false,
            message: 'Internal Server Error'
        });
    }
}