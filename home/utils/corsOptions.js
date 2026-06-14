const allowedOrigins = [
    "https://kelseywilliams.co",
    "https://www.kelseywilliams.co",
    "http://localhost",
]

const corsOptions = {
    origin : (origin, cb) => {
        if (!origin || allowedOrigins.includes(origin)) {
            cb(null, true);
        } else {
            cb(new Error("Not allowed by CORS"));
        }
    },
    credentials: true,
    // DELETE/OPTIONS are required by this API (e.g. /auth/delete, /chat/delete) — unlike chat,
    // which only needs GET/POST. cors handles the OPTIONS preflight automatically.
    methods: ["GET", "POST", "OPTIONS", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
}

export { allowedOrigins, corsOptions };
