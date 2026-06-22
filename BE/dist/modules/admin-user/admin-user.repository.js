"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminUserRepository = exports.AdminUserRepository = void 0;
const user_model_1 = require("../../models/user.model");
const userListProjection = '-passwordHash -emailVerifyToken -emailVerifyTokenExpires';
class AdminUserRepository {
    async findPaginated(filters, page, limit) {
        const query = {};
        if (filters.role)
            query.role = filters.role;
        if (filters.status)
            query.status = filters.status;
        if (filters.keyword) {
            query.$or = [
                { fullName: { $regex: filters.keyword, $options: 'i' } },
                { email: { $regex: filters.keyword, $options: 'i' } },
                { phone: { $regex: filters.keyword, $options: 'i' } },
            ];
        }
        const skip = (page - 1) * limit;
        const [items, total] = await Promise.all([
            user_model_1.User.find(query)
                .select(userListProjection)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .exec(),
            user_model_1.User.countDocuments(query).exec(),
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
        return user_model_1.User.findById(id).select(userListProjection).exec();
    }
    async updateStatusById(id, status, incrementTokenVersion = false) {
        const update = { $set: { status } };
        if (incrementTokenVersion) {
            update.$inc = { refreshTokenVersion: 1 };
        }
        return user_model_1.User.findByIdAndUpdate(id, update, { new: true, runValidators: true })
            .select(userListProjection)
            .exec();
    }
}
exports.AdminUserRepository = AdminUserRepository;
exports.adminUserRepository = new AdminUserRepository();
//# sourceMappingURL=admin-user.repository.js.map