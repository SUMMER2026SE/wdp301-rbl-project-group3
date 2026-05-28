"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = void 0;
const token_util_1 = require("../utils/token.util");
const errorHandler_middleware_1 = require("./errorHandler.middleware");
const authenticate = (req, _res, next) => {
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
        req.user = {
            userId: payload.userId,
            email: payload.email,
            role: payload.role,
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