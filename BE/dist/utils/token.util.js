"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateTokenPair = exports.verifyRefreshToken = exports.verifyAccessToken = exports.generateRefreshToken = exports.generateAccessToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_config_1 = require("../config/env.config");
const generateAccessToken = (payload) => {
    return jsonwebtoken_1.default.sign(payload, env_config_1.env.jwt.accessSecret, {
        expiresIn: env_config_1.env.jwt.accessExpiresIn,
    });
};
exports.generateAccessToken = generateAccessToken;
const generateRefreshToken = (payload) => {
    return jsonwebtoken_1.default.sign(payload, env_config_1.env.jwt.refreshSecret, {
        expiresIn: env_config_1.env.jwt.refreshExpiresIn,
    });
};
exports.generateRefreshToken = generateRefreshToken;
const verifyAccessToken = (token) => {
    return jsonwebtoken_1.default.verify(token, env_config_1.env.jwt.accessSecret);
};
exports.verifyAccessToken = verifyAccessToken;
const verifyRefreshToken = (token) => {
    return jsonwebtoken_1.default.verify(token, env_config_1.env.jwt.refreshSecret);
};
exports.verifyRefreshToken = verifyRefreshToken;
const generateTokenPair = (user, tokenId) => {
    const accessToken = (0, exports.generateAccessToken)({
        userId: user._id.toString(),
        email: user.email,
        role: user.role,
        tokenVersion: user.refreshTokenVersion,
    });
    const refreshToken = (0, exports.generateRefreshToken)({
        userId: user._id.toString(),
        tokenId,
    });
    return { accessToken, refreshToken };
};
exports.generateTokenPair = generateTokenPair;
//# sourceMappingURL=token.util.js.map