"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bannerRepository = exports.BannerRepository = void 0;
const banner_model_1 = require("../../models/banner.model");
class BannerRepository {
    async create(data) {
        return new banner_model_1.Banner(data).save();
    }
    async findPaginated(filters, page, limit) {
        const query = {};
        if (filters.status)
            query.status = filters.status;
        const skip = (page - 1) * limit;
        const [items, total] = await Promise.all([
            banner_model_1.Banner.find(query)
                .sort({ order: 1, createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .exec(),
            banner_model_1.Banner.countDocuments(query).exec(),
        ]);
        return {
            items,
            total,
            page,
            limit,
            totalPages: total === 0 ? 0 : Math.ceil(total / limit),
        };
    }
    async findById(id) {
        return banner_model_1.Banner.findById(id).exec();
    }
    async updateById(id, data) {
        return banner_model_1.Banner.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true }).exec();
    }
    async deleteById(id) {
        return banner_model_1.Banner.findByIdAndDelete(id).exec();
    }
    async findActiveBanners() {
        return banner_model_1.Banner.find({ status: 'active' }).sort({ order: 1, createdAt: -1 }).exec();
    }
}
exports.BannerRepository = BannerRepository;
exports.bannerRepository = new BannerRepository();
//# sourceMappingURL=banner.repository.js.map