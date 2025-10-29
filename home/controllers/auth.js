import bcrypt from "bcrypt";
import { getPool } from "../utils/postgres.js";
import { getRedisClient } from "../utils/redis.js";
import logger from "../utils/logger.js";
import jwt from "jsonwebtoken";
import { TOKEN, USER, TOKEN_EXPIRY_MINS } from "../config/index.js";

export async function Register(req, res) {
    try {
        const pool = getPool();
        const { username, password, email } = req.body;
        const role = USER;
        // Check if user exsits
        const exists = await pool.query(
            'select id from users where email = $1 or username = $2',
            [email, username]
        );

        if(exists.rows.length > 0) {
            return res.status(409).json({
                status: false,
                message: "User with this username or password already exists."
            })
        } 

        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        // Insert user
        const result = await pool.query(
            "insert into users(email, username, role, password) values ($1, $2, $3, $4) returning id, email, username, role, created_at",
            [email, username, role, hashedPassword]
        )

        if (result.rows && result.rows.length > 0) {
            logger.info(`Created user ${username}`)
            return res.status(201).json({
                status: true,
                message: "Account created successfully."
            });
        } else {
            throw new Error(`result.rows = ${result.rows}`);
        }
    } catch (err) {
        logger.error("Account creation failed:", err);
        return res.status(500).json({
            status: false,
            message: "Internal Server Error"
        });
    }
}

export async function Login(req, res) {
    try {
        const pool = getPool();
        const { email, username, password } = req.body;
        const exists = await pool.query(
            'select id, password from users where email = $1 or username = $2',
            [email, username]
        );
        
        if(exists.rows.length == 0){
            return res.status(401).json({
                status: false,
                message: "Invalid username or password."
            });
        } else {
            const user = exists.rows[0];
            const isPasswordValid = await bcrypt.compare(`${password}`, user.password);

            if (!isPasswordValid){
                return res.status(401).json({
                    status: false,
                    message: "Invalid username or password."
                })
            } else {
                const payload = { id: user.id }
                const token = jwt.sign(payload, TOKEN, {
                    expiresIn: `${TOKEN_EXPIRY_MINS}m`,
                });

                let options = {
                    maxAge: 20 * 60 * 1000, // would expire in 20minutes
                    httpOnly: true, // The cookie is only accessible by the web server
                    secure: true,
                    sameSite: "None",
                };
                res.cookie("SessionID", token, options); 
                logger.info(`${username} at ${email} logged in.`)
                return res.status(200).json({
                    status: true,
                    message: "Successfully logged in."
                })
            }
        }
    } catch(err){
        logger.error(err);
        return res.status(500).json({
            status: false,
            message: "Internal server error"
        })
    }
}

export async function VerifyUser(req, res) {
    try {
        return res.status(200).json({
            status: true,
            data: req.user,
            message: "User verfied."
        })
    } catch (err) {
        logger.error(err);
        return res.status(500).json({
            status: false,
            data: req.user,
            message: err
        })
    }
}

export async function VerifyAdmin(req, res) {
    try {
        return res.status(200).json({
            status: true,
            data: req.user,
            message: "Admin role verified."
        })
    } catch (err) {
        logger.error(err);
        return res.status(500).json({
            status: false,
            data: req.user,
            message: err
        })
    }
}

export async function Logout(req, res){
    try {
        const client = getRedisClient();
        
        const authHeader = req.headers["cookie"];
        if (!authHeader) {
            return res.status(204);
        }
        const cookie = authHeader.split('=')[1];
        const token = cookie.split(';')[0];
        const decoded = jwt.decode(token);
        const jwtExpInSeconds = decoded.exp - Math.floor(Date.now() / 1000);
        if (jwtExpInSeconds <= 0) {
            res.setHeader('Clear-Site-Data', '"cookies"');
            return res.status(204).json({
                status: true,
                message: "Already loggged out."
            })
        }
        const result = await client.setEx(token, jwtExpInSeconds, 'blacklisted');

        if (result === 'OK'){
            res.setHeader('Clear-Site-Data', '"cookies"');
            logger.info(`${req.user.username} successfully logged out.`)
            return res.status(200).json({ 
                status: true,
                message: 'Successfully logged out.' 
            });
        } else {
            throw new Error("Encountered error while logging out.");
        }

    } catch (err) {
        logger.error(err);
        return res.status(500).json({
            status: false,
            message: "Internal Server Error."
        })
    }
}

export async function Delete(req, res){
    try {
        const client = getRedisClient();
        const pool = getPool();
        
        const authHeader = req.headers["cookie"];
        if (!authHeader) {
            return res.status(204);
        }
        const cookie = authHeader.split('=')[1];
        const token = cookie.split(';')[0];
        const decoded = jwt.decode(token);
        const jwtExpInSeconds = decoded.exp - Math.floor(Date.now() / 1000);
        // TODO: What the hell is this.  Fix it.
        if (jwtExpInSeconds <= 0) {
            res.setHeader('Clear-Site-Data', '"cookies"');
            throw new Error("Failed to deleted account. Invalid or expired session.");
        }
        const result = await client.setEx(token, jwtExpInSeconds, 'blacklisted');

        if (result === 'OK'){
            res.setHeader('Clear-Site-Data', '"cookies"');
            const result = await pool.query(
                'delete from users where id = $1 returning id, username',
                [req.user.id]
            );
            if (result.rows.length > 0) {
                return res.status(200).json({
                    status: true,
                    message: "Account deleted successfully."
                })
            }
        } else {
            throw new Error("Failed to delete account.");
        }

    } catch (err) {
        logger.error(err);
        return res.status(500).json({
            status: false,
            message: "Internal server error."
        })
    }
}

export async function SendCodeCtlr(req, res){
    try {
        return res.status(200).json({
            status: true,
            message: "Verification code sent."
        })
    } catch (err) {
        logger.error(err);
        return res.status(500).json({
            status: false,
            message: err
        })
    }
}