import * as dotenv from "dotenv";
dotenv.config();

const { 
    REDIS_URI, 
    POSTGRES_URI, 
    PORT, 
    SECRET_ACCESS_TOKEN,
    ADMIN,
    USER,
    TOKEN_EXPIRY_MINS
} = process.env;

export { 
    REDIS_URI, 
    POSTGRES_URI,
    PORT, 
    SECRET_ACCESS_TOKEN,
    ADMIN,
    USER,
    TOKEN_EXPIRY_MINS
};