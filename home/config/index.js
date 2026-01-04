import * as dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const postgres_worker_pwd = fs.readFileSync('/run/secrets/postgres_worker_secret', 'utf-8').trim();
const postgres_readonly_pwd = fs.readFileSync('/run/secrets/postgres_readonly_secret', 'utf-8').trim();
const redis_pwd = fs.readFileSync('/run/secrets/redis_secret', 'utf-8').trim();
const PRIVATE_KEY = fs.readFileSync('/run/secrets/jwt_private', 'utf-8').trim();
const PUBLIC_KEY = fs.readFileSync('/run/secrets/jwt_public', 'utf-8').trim();
const MAILJET_API_KEY = fs.readFileSync('/run/secrets/mailjet_api_key', 'utf-8').trim();
const MAILJET_SECRET = fs.readFileSync('/run/secrets/mailjet_secret', 'utf-8').trim();

const REDIS_URI = `redis://api:${redis_pwd}@redis:6379`;
const POSTGRES_WORKER_URI = `postgresql://worker:${postgres_worker_pwd}@postgres:5432/apidb`;
const { 
    PORT, 
    ADMIN,
    USER,
    TOKEN_EXPIRY_MINS
} = process.env;

export { 
    REDIS_URI, 
    POSTGRES_WORKER_URI,
    PORT, 
    PRIVATE_KEY,
    PUBLIC_KEY,
    ADMIN,
    USER,
    TOKEN_EXPIRY_MINS,
    MAILJET_API_KEY,
    MAILJET_SECRET
};
