"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = void 0;
const token_util_1 = require("../utils/token.util");
const errorHandler_middleware_1 = require("./errorHandler.middleware");
const user_model_1 = require("../models/user.model");
const authenticate = async (req, _res, next) => {
    try {
        let token;
        const authHeader = req.headers.authorization;
        if (authHeader?.startsWith('Bearer ')) {
            token = authHeader.substring(7);
        }
        if (!token && req.cookies?.accessToken) {
            token = req.cookies.accessToken;
        }
        if (!token) {
            throw new errorHandler_middleware_1.AppError('Access token required', 401);
        }
        const payload = (0, token_util_1.verifyAccessToken)(token);
        const user = await user_model_1.User.findById(payload.userId)
            .select('email role status refreshTokenVersion')
            .lean()
            .exec();
        if (!user) {
            throw new errorHandler_middleware_1.AppError('User account no longer exists', 401);
        }
        if (user.status !== 'active') {
            throw new errorHandler_middleware_1.AppError('Account is not active', 403);
        }
        if (user.refreshTokenVersion !== payload.tokenVersion ||
            user.role !== payload.role) {
            throw new errorHandler_middleware_1.AppError('Session is no longer valid. Please login again.', 401);
        }
        req.user = {
            userId: payload.userId,
            email: user.email,
            role: user.role,
            tokenVersion: payload.tokenVersion,
        };
        next();
    }
    catch (error) {
        next(error);
    }
};
exports.authenticate = authenticate;
//# sourceMappingURL=auth.middleware.js.map