"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.systemSettingService = exports.SystemSettingService = void 0;
const mongoose_1 = require("mongoose");
const errorHandler_middleware_1 = require("../../middlewares/errorHandler.middleware");
const system_setting_repository_1 = require("./system-setting.repository");
const system_setting_defaults_1 = require("./system-setting.defaults");
function toSettingResponse(setting) {
    return {
        id: setting._id.toString(),
        key: setting.key,
        label: setting.label,
        group: setting.group,
        value: setting.value,
        valueType: setting.valueType,
        description: setting.description,
        isPublic: setting.isPublic,
        updatedBy: setting.updatedBy?.toString(),
        createdAt: setting.createdAt,
        updatedAt: setting.updatedAt,
    };
}
function assertValueMatchesType(value, valueType) {
    if (valueType === 'string' && typeof value !== 'string') {
        throw new errorHandler_middleware_1.AppError('Value must be a string for valueType "string"', 400);
    }
    if (valueType === 'number' && (typeof value !== 'number' || Number.isNaN(value))) {
        throw new errorHandler_middleware_1.AppError('Value must be a number for valueType "number"', 400);
    }
    if (valueType === 'boolean' && typeof value !== 'boolean') {
        throw new errorHandler_middleware_1.AppError('Value must be a boolean for valueType "boolean"', 400);
    }
}
class SystemSettingService {
    async ensureDefaultSettings() {
        const count = await system_setting_repository_1.systemSettingRepository.countAll();
        if (count > 0)
            return;
        await system_setting_repository_1.systemSettingRepository.insertMany(system_setting_defaults_1.DEFAULT_SYSTEM_SETTINGS);
    }
    async listSettings(query) {
        await this.ensureDefaultSettings();
        const { items, total, page, limit, totalPages } = await system_setting_repository_1.systemSettingRepository.findPaginated({
            group: query.group,
            keyword: query.keyword,
            isPublic: query.isPublic,
        }, query.page, query.limit);
        return {
            settings: items.map(toSettingResponse),
            pagination: { page, limit, total, totalPages },
        };
    }
    async getPublicSettings() {
        await this.ensureDefaultSettings();
        const settings = await system_setting_repository_1.systemSettingRepository.findAllPublic();
        return settings.reduce((acc, setting) => {
            acc[setting.key] = setting.value;
            return acc;
        }, {});
    }
    async getSettingByKey(key) {
        await this.ensureDefaultSettings();
        const setting = await system_setting_repository_1.systemSettingRepository.findByKey(key);
        if (!setting)
            throw new errorHandler_middleware_1.AppError('Setting not found', 404);
        return toSettingResponse(setting);
    }
    async getSettingsByGroup() {
        await this.ensureDefaultSettings();
        const settings = await system_setting_repository_1.systemSettingRepository.findAll();
        const grouped = settings.reduce((acc, setting) => {
            const response = toSettingResponse(setting);
            if (!acc[setting.group])
                acc[setting.group] = [];
            acc[setting.group].push(response);
            return acc;
        }, {});
        return { groups: grouped };
    }
    async createSetting(data, adminUserId) {
        assertValueMatchesType(data.value, data.valueType);
        const existing = await system_setting_repository_1.systemSettingRepository.findByKey(data.key);
        if (existing)
            throw new errorHandler_middleware_1.AppError('Setting key already exists', 409);
        const setting = await system_setting_repository_1.systemSettingRepository.create({
            ...data,
            key: data.key.toLowerCase(),
            isPublic: data.isPublic ?? false,
            updatedBy: new mongoose_1.Types.ObjectId(adminUserId),
        });
        return toSettingResponse(setting);
    }
    async updateSetting(key, data, adminUserId) {
        const setting = await system_setting_repository_1.systemSettingRepository.findByKey(key);
        if (!setting)
            throw new errorHandler_middleware_1.AppError('Setting not found', 404);
        const nextValueType = data.valueType ?? setting.valueType;
        if (data.value !== undefined) {
            assertValueMatchesType(data.value, nextValueType);
        }
        else if (data.valueType !== undefined && data.valueType !== setting.valueType) {
            assertValueMatchesType(setting.value, data.valueType);
        }
        const updated = await system_setting_repository_1.systemSettingRepository.updateByKey(key, {
            ...data,
            updatedBy: new mongoose_1.Types.ObjectId(adminUserId),
        });
        if (!updated)
            throw new errorHandler_middleware_1.AppError('Setting not found', 404);
        return toSettingResponse(updated);
    }
    async bulkUpdateSettings(items, adminUserId) {
        const updated = [];
        const notFound = [];
        for (const item of items) {
            const setting = await system_setting_repository_1.systemSettingRepository.findByKey(item.key);
            if (!setting) {
                notFound.push(item.key);
                continue;
            }
            assertValueMatchesType(item.value, setting.valueType);
            const result = await system_setting_repository_1.systemSettingRepository.updateByKey(item.key, {
                value: item.value,
                updatedBy: new mongoose_1.Types.ObjectId(adminUserId),
            });
            if (result)
                updated.push(toSettingResponse(result));
        }
        if (notFound.length > 0) {
            throw new errorHandler_middleware_1.AppError(`Settings not found: ${notFound.join(', ')}`, 404);
        }
        return { settings: updated };
    }
    async deleteSetting(key) {
        const setting = await system_setting_repository_1.systemSettingRepository.findByKey(key);
        if (!setting)
            throw new errorHandler_middleware_1.AppError('Setting not found', 404);
        const isDefault = system_setting_defaults_1.DEFAULT_SYSTEM_SETTINGS.some((item) => item.key === setting.key);
        if (isDefault) {
            throw new errorHandler_middleware_1.AppError('Cannot delete a default system setting', 400);
        }
        const deleted = await system_setting_repository_1.systemSettingRepository.deleteByKey(key);
        if (!deleted)
            throw new errorHandler_middleware_1.AppError('Setting not found', 404);
        return toSettingResponse(deleted);
    }
}
exports.SystemSettingService = SystemSettingService;
exports.systemSettingService = new SystemSettingService();
//# sourceMappingURL=system-setting.service.js.map