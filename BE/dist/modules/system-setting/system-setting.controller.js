"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.systemSettingController = exports.SystemSettingController = void 0;
const system_setting_service_1 = require("./system-setting.service");
const asyncHandler_1 = require("../../utils/asyncHandler");
const response_util_1 = require("../../utils/response.util");
const system_setting_validation_1 = require("./system-setting.validation");
class SystemSettingController {
    constructor() {
        this.list = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { query } = system_setting_validation_1.listSettingsSchema.parse({
                query: req.query,
                body: req.body,
                params: req.params,
            });
            const result = await system_setting_service_1.systemSettingService.listSettings(query);
            (0, response_util_1.sendSuccess)(res, result, 'Settings retrieved');
        });
        this.getPublic = (0, asyncHandler_1.asyncHandler)(async (_req, res) => {
            const settings = await system_setting_service_1.systemSettingService.getPublicSettings();
            (0, response_util_1.sendSuccess)(res, { settings }, 'Public settings retrieved');
        });
        this.getByGroup = (0, asyncHandler_1.asyncHandler)(async (_req, res) => {
            const result = await system_setting_service_1.systemSettingService.getSettingsByGroup();
            (0, response_util_1.sendSuccess)(res, result, 'Settings retrieved');
        });
        this.getByKey = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const setting = await system_setting_service_1.systemSettingService.getSettingByKey(String(req.params.key));
            (0, response_util_1.sendSuccess)(res, { setting }, 'Setting retrieved');
        });
        this.create = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { body } = system_setting_validation_1.createSettingSchema.parse({
                query: req.query,
                body: req.body,
                params: req.params,
            });
            const setting = await system_setting_service_1.systemSettingService.createSetting(body, req.user.userId);
            (0, response_util_1.sendSuccess)(res, { setting }, 'Setting created', 201);
        });
        this.update = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { params, body } = system_setting_validation_1.updateSettingSchema.parse({
                query: req.query,
                body: req.body,
                params: req.params,
            });
            const setting = await system_setting_service_1.systemSettingService.updateSetting(params.key, body, req.user.userId);
            (0, response_util_1.sendSuccess)(res, { setting }, 'Setting updated');
        });
        this.bulkUpdate = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { body } = system_setting_validation_1.bulkUpdateSettingsSchema.parse({
                query: req.query,
                body: req.body,
                params: req.params,
            });
            const result = await system_setting_service_1.systemSettingService.bulkUpdateSettings(body.settings, req.user.userId);
            (0, response_util_1.sendSuccess)(res, result, 'Settings updated');
        });
        this.delete = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const setting = await system_setting_service_1.systemSettingService.deleteSetting(String(req.params.key));
            (0, response_util_1.sendSuccess)(res, { setting }, 'Setting deleted');
        });
    }
}
exports.SystemSettingController = SystemSettingController;
exports.systemSettingController = new SystemSettingController();
//# sourceMappingURL=system-setting.controller.js.map