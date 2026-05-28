"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorize = void 0;
const errorHandler_middleware_1 = require("./errorHandler.middleware");
const authorize = (...roles) => {
    return (req, _res, next) => {
        if (!req.user) {
            return next(new errorHandler_middleware_1.AppError('Not authenticated', 401));
        }
        if (!roles.includes(req.user.role)) {
            return next(new errorHandler_middleware_1.AppError('Insufficient permissions', 403));
        }
        next();
    };
};
exports.authorize = authorize;
//# sourceMappingURL=role.middleware.js.map