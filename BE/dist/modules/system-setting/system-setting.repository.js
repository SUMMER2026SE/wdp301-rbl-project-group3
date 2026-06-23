"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.systemSettingRepository = exports.SystemSettingRepository = void 0;
const system_setting_model_1 = require("../../models/system-setting.model");
class SystemSettingRepository {
    async countAll() {
        return system_setting_model_1.SystemSetting.countDocuments().exec();
    }
    async insertMany(data) {
        await system_setting_model_1.SystemSetting.insertMany(data);
    }
    async create(data) {
        return new system_setting_model_1.SystemSetting(data).save();
    }
    async findPaginated(filters, page, limit) {
        const query = {};
        if (filters.group)
            query.group = filters.group;
        if (filters.isPublic !== undefined)
            query.isPublic = filters.isPublic;
        if (filters.keyword) {
            query.$or = [
                { key: { $regex: filters.keyword, $options: 'i' } },
                { label: { $regex: filters.keyword, $options: 'i' } },
                { description: { $regex: filters.keyword, $options: 'i' } },
            ];
        }
        const skip = (page - 1) * limit;
        const [items, total] = await Promise.all([
            system_setting_model_1.SystemSetting.find(query).sort({ group: 1, key: 1 }).skip(skip).limit(limit).exec(),
            system_setting_model_1.SystemSetting.countDocuments(query).exec(),
        ]);
        return {
            items,
            total,
            page,
            limit,
            totalPages: total === 0 ? 0 : Math.ceil(total / limit),
        };
    }
    async findAllPublic() {
        return system_setting_model_1.SystemSetting.find({ isPublic: true }).sort({ group: 1, key: 1 }).exec();
    }
    async findAll() {
        return system_setting_model_1.SystemSetting.find().sort({ group: 1, key: 1 }).exec();
    }
    async findByKey(key) {
        return system_setting_model_1.SystemSetting.findOne({ key: key.toLowerCase() }).exec();
    }
    async updateByKey(key, data) {
        return system_setting_model_1.SystemSetting.findOneAndUpdate({ key: key.toLowerCase() }, data, { new: true }).exec();
    }
    async deleteByKey(key) {
        return system_setting_model_1.SystemSetting.findOneAndDelete({ key: key.toLowerCase() }).exec();
    }
}
exports.SystemSettingRepository = SystemSettingRepository;
exports.systemSettingRepository = new SystemSettingRepository();
//# sourceMappingURL=system-setting.repository.js.map