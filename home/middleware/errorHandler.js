import logger from ".../utils/logger.js";

export const errorHandler = (err, req, res, next) => {
    logger.error({
        message: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method
    });

    const statusCode = err.statusCode || 500;
    const message = "Internal server error";

    res.status(statusCode).json({
        success: false,
        error: message,
        stack: err.stack
    });
};

export const notFoundHandler = (req, res) => {
    res.status(404).json({
        success: false,
        error: "Route not found"
    });
};

