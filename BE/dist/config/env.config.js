"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const requireEnv = (key) => {
    const value = process.env[key];
    if (!value)
        throw new Error(`Missing required environment variable: ${key}`);
    return value;
};
exports.env = {
    port: parseInt(process.env.PORT || '3000', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    isProduction: process.env.NODE_ENV === 'production',
    mongodbUri: requireEnv('MONGODB_URI'),
    jwt: {
        accessSecret: requireEnv('JWT_ACCESS_SECRET'),
        refreshSecret: requireEnv('JWT_REFRESH_SECRET'),
        accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
        refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
        refreshExpiresInMs: 7 * 24 * 60 * 60 * 1000,
    },
    email: {
        host: requireEnv('EMAIL_HOST'),
        port: parseInt(process.env.EMAIL_PORT || '587', 10),
        user: requireEnv('EMAIL_USER'),
        pass: requireEnv('EMAIL_PASS'),
        from: requireEnv('EMAIL_FROM'),
    },
    clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',
    cloudinary: {
        cloudName: requireEnv('CLOUDINARY_CLOUD_NAME'),
        apiKey: requireEnv('CLOUDINARY_API_KEY'),
        apiSecret: requireEnv('CLOUDINARY_API_SECRET'),
    },
    google: {
        clientId: requireEnv('GOOGLE_CLIENT_ID'),
    },
    geminiApiKey: process.env.GEMINI_API_KEY || '',
};
//# sourceMappingURL=env.config.js.map