import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { getPool } from "../utils/postgres.js";
import { getRedisClient } from "../utils/redis.js";
import logger from "../utils/logger.js";
import { PRIVATE_KEY, PUBLIC_KEY, USER, TOKEN_EXPIRY_MINS } from "../config/index.js";

export async function Register(req, res) {
    try {
        const pool = await getPool();
        const { username, password, email } = req.body;
        const role = USER;
        // Check if user exsits
        const exists = await pool.query(
            'select id from users where email = $1 or username = $2',
            [email, username]
        );

        if(exists.rows.length > 0) {
            return res.status(409).json({
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
            const user = result.rows[0];
            const token = jwt.sign(
                {
                    id: user.id
                 }, 
                PRIVATE_KEY, 
                {
                    algorithm: "RS256",
                    expiresIn: `${TOKEN_EXPIRY_MINS}m`,
                    issuer: "https://api.kelseywilliams.co"
            });
            
            let options = {
                maxAge: 20 * 60 * 1000,
                httpOnly: true,
                secure: true,
                sameSite: "None",
                domain: ".kelseywilliams.co",
                path: "/"
            }

            res.cookie("SessionID", token, options);

            logger.info(`Created user ${username}`);

            return res.status(201).json({    
                message: "Account created successfully."
            });
        } else {
            throw new Error(`result.rows = ${result.rows}`);
        }
    } catch (err) {
        logger.error("Account creation failed:", err);
        return res.status(500).json({ 
            message: "Internal Server Error"
        });
    }
}

export async function Login(req, res) {
    try {
        const pool = await getPool();
        const { email, username, password } = req.body;
        const identifier = email || username;
        const exists = await pool.query(
            'select id, username, password from users where email = $1 or username = $1',
            [identifier]
        );
        
        if(exists.rows.length == 0){
            return res.status(401).json({  
                message: "Invalid username or password."
            });
        } else {
            const user = exists.rows[0];
            const isPasswordValid = await bcrypt.compare(`${password}`, user.password);
   
            if (!isPasswordValid){
                return res.status(401).json({   
                    message: "Invalid username or password."
                })
            } else {
                const token = jwt.sign(
                    {
                        id: user.id
                    },
                    PRIVATE_KEY,
                    {
                        algorithm: "RS256",
                        expiresIn: `${TOKEN_EXPIRY_MINS}m`,
                        issuer: "https://api.kelseywilliams.co"
                    }
                );

                let options = {
                    maxAge: 20 * 60 * 1000, // would expire in 20minutes
                    httpOnly: true, // The cookie is only accessible by the web server
                    secure: true,
                    sameSite: "None",
                    domain: ".kelseywilliams.co",
                    path: "/"
                };
                //TODO: Change session ID to jwt?
                res.cookie("SessionID", token, options); 

                return res.status(200).json({      
                    message: "Successfully logged in."
                })
            }
        }
    } catch(err){
        logger.error(err);
        return res.status(500).json({ 
            message: "Internal server error"
        })
    }
}

export async function VerifyUser(req, res) {
    try {
        return res.status(200).json({    
            id: req.id,
            username: req.username,
            email: req.email,
            role: req.role
        })
    } catch (err) {
        logger.error(err);
        return res.status(500).json({      
            message: err
        })
    }
}

export async function VerifyAdminCtlr(req, res) {
    try {
        return res.status(200).json({        
            id: req.id,
            username: req.username,
            email: req.email,
            role: req.role
        })
    } catch (err) {
        logger.error(err);
        return res.status(500).json({
            data: req.user,
            message: err
        })
    }
}

function processTokenForExp(token) {
    if (!token) { return res.status.json({
        message: "Invalid or expired session. Please log in"
    })}

    try {
        const verify = jwt.verify(
            token,
            PUBLIC_KEY,
            { 
                algorithms: ["RS256"]
            }
        );
        return verify.exp - Math.floor(Date.now() / 1000);
    } catch {
        return res.status(400).json({
            message: "Invalid or expired session.  Please log in"
        });
    }
}

export async function Logout(req, res){
    try {
        const client = getRedisClient();
        const token = req.cookies.SessionID;
        const jwtExpInSeconds = processTokenForExp(token);
 
        if (jwtExpInSeconds <= 0) {
            res.setHeader('Clear-Site-Data', '"cookies"');
            throw new Error("Invalid or expired session. Please log in");
        }
        const result = await client.setEx(token, jwtExpInSeconds, 'blacklisted');

        if (result == "OK") {
            res.setHeader('Clear-Site-Data', '"cookies"');
            return res.status(200).json({
                message: 'Successfully logged out.'
            });
        } else {
            throw new Error("Encountered error while logging out.");
        }

    } catch (err) {
        logger.error(err);
        return res.status(500).json({
            message: "Internal Server Error."
        })
    }
}

export async function Delete(req, res){
    try {
        const client = getRedisClient();
        const pool = getPool();
        const token = req.cookies.SessionID;
        const jwtExpInSeconds = processTokenForExp(token);

        if (jwtExpInSeconds <= 0) {
            res.setHeader('Clear-Site-Data', '"cookies"');
            throw new Error("Invalid or expired session. Please log in");
        }
        const result = await client.setEx(token, jwtExpInSeconds, 'blacklisted');

        if (result === 'OK'){
            res.setHeader('Clear-Site-Data', '"cookies"');
            const result = await pool.query(
                'delete from users where username = $1 returning id, username',
                [req.username]
            );
            if (result.rows.length > 0) {
                return res.status(200).json({   
                    message: "Account deleted successfully."
                })
            }
        } else {
            throw new Error("Failed to delete account.");
        }

    } catch (err) {
        logger.error(err);
        return res.status(500).json({
            message: "Internal server error."
        })
    }
}

export async function SendCodeCtlr(req, res){
    try {
        return res.status(200).json({
            message: "Verification code sent."
        })
    } catch (err) {
        logger.error(err);
        return res.status(500).json({
            message: err
        })
    }
}

export async function RecoveryCodeCtlr(req, res){
    try{
        return res.status(200).json({
            message: "Recovery code sent."
        }) 
    } catch (err){
        logger.error(err);
        return res.status(500).json({
            message: err
        })
    }
}

export async function ResetPassword(req, res) {
    try {
        const pool = getPool();
        const { password, email } = req.body;

        // Check if user exists
        const exists = await pool.query(
            'select id, username FROM users WHERE email = $1',
            [email]
        );

        if (exists.rows.length === 0) {
            return res.status(404).json({
                status: false,
                message: "An account with that email couldn't be found."
            });
        }

        const user = exists.rows[0];
        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Update user password
        await pool.query(
            'UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
            [hashedPassword, user.id]
        );

        logger.info(`Password reset for user ${user.username} (${email})`);

        return res.status(200).json({
            message: "Password updated successfully."
        });

    } catch (err) {
        logger.error("Password reset failed:", err);
        return res.status(500).json({
            message: "Internal Server Error"
        });
    }
}

