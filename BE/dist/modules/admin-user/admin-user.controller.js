"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminUserController = exports.AdminUserController = void 0;
const admin_user_service_1 = require("./admin-user.service");
const asyncHandler_1 = require("../../utils/asyncHandler");
const response_util_1 = require("../../utils/response.util");
const admin_user_validation_1 = require("./admin-user.validation");
class AdminUserController {
    constructor() {
        this.list = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { query } = admin_user_validation_1.listUsersSchema.parse({
                query: req.query,
                body: req.body,
                params: req.params,
            });
            const result = await admin_user_service_1.adminUserService.listUsers(query);
            (0, response_util_1.sendSuccess)(res, result, 'Users retrieved');
        });
        this.lock = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const user = await admin_user_service_1.adminUserService.lockUser(String(req.params.id), req.user.userId);
            (0, response_util_1.sendSuccess)(res, { user }, 'User locked');
        });
        this.unlock = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const user = await admin_user_service_1.adminUserService.unlockUser(String(req.params.id));
            (0, response_util_1.sendSuccess)(res, { user }, 'User unlocked');
        });
        this.changeRole = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { params, body } = admin_user_validation_1.changeRoleSchema.parse({
                query: req.query,
                body: req.body,
                params: req.params,
            });
            const user = await admin_user_service_1.adminUserService.changeUserRole(params.id, req.user.userId, body);
            (0, response_util_1.sendSuccess)(res, { user }, 'User role updated');
        });
    }
}
exports.AdminUserController = AdminUserController;
exports.adminUserController = new AdminUserController();
//# sourceMappingURL=admin-user.controller.js.map