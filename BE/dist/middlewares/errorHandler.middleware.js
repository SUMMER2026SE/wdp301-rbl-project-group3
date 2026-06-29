"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = exports.AppError = void 0;
const zod_1 = require("zod");
const jsonwebtoken_1 = require("jsonwebtoken");
class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
const errorHandler = (err, _req, res, _next) => {
    console.error('[ERROR]', err);
    if (err instanceof AppError) {
        res.status(err.statusCode).json({
            success: false,
            message: err.message,
        });
        return;
    }
    // Fix 1 & 2: cast err sang ZodError rõ ràng, type ZodIssue cho callback
    if (err instanceof zod_1.ZodError) {
        const zodErr = err;
        res.status(422).json({
            success: false,
            message: 'Validation failed',
            errors: zodErr.issues.map((issue) => ({
                field: issue.path.join('.'),
                message: issue.message,
            })),
        });
        return;
    }
    if (err.name === 'MulterError') {
        res.status(400).json({
            success: false,
            message: err.message === 'File too large' ? 'File size exceeds the 10MB limit' : err.message,
        });
        return;
    }
    if (err instanceof jsonwebtoken_1.TokenExpiredError) {
        res.status(401).json({
            success: false,
            message: 'Token expired',
        });
        return;
    }
    if (err instanceof jsonwebtoken_1.JsonWebTokenError) {
        res.status(401).json({
            success: false,
            message: 'Invalid token',
        });
        return;
    }
    // Fix 3: dùng type guard kiểm tra code trước khi so sánh
    const mongoError = err;
    if (mongoError.code !== undefined && String(mongoError.code) === '11000') {
        res.status(409).json({
            success: false,
            message: 'Resource already exists',
        });
        return;
    }
    res.status(500).json({
        success: false,
        message: 'Internal server error',
    });
};
exports.errorHandler = errorHandler;
//# sourceMappingURL=errorHandler.middleware.js.map