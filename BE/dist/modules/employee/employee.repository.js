"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.employeeRepository = exports.EmployeeRepository = void 0;
const mongoose_1 = require("mongoose");
const user_model_1 = require("../../models/user.model");
const employeeProjection = '-passwordHash -emailVerifyToken -emailVerifyTokenExpires';
class EmployeeRepository {
    async findPaginated(filters, page, limit) {
        const query = {
            role: filters.role || { $in: ['branch_manager', 'staff'] },
        };
        if (filters.branchId)
            query.branchId = new mongoose_1.Types.ObjectId(filters.branchId);
        if (filters.status)
            query.status = filters.status;
        if (filters.keyword) {
            query.$or = [
                { fullName: { $regex: filters.keyword, $options: 'i' } },
                { email: { $regex: filters.keyword, $options: 'i' } },
                { phone: { $regex: filters.keyword, $options: 'i' } },
            ];
        }
        const [employees, total] = await Promise.all([
            user_model_1.User.find(query)
                .select(employeeProjection)
                .populate('branchId', 'name code address status')
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .exec(),
            user_model_1.User.countDocuments(query).exec(),
        ]);
        return {
            employees,
            total,
            page,
            limit,
            totalPages: total === 0 ? 0 : Math.ceil(total / limit),
        };
    }
    async findById(id) {
        return user_model_1.User.findById(id)
            .select(employeeProjection)
            .populate('branchId', 'name code address status')
            .exec();
    }
    async findRawById(id) {
        return user_model_1.User.findById(id).select(employeeProjection).exec();
    }
    async findByEmail(email) {
        return user_model_1.User.findOne({ email: email.toLowerCase() }).select(employeeProjection).exec();
    }
    async create(data) {
        const { id, ...employeeData } = data;
        return new user_model_1.User({
            ...employeeData,
            _id: new mongoose_1.Types.ObjectId(id),
            email: employeeData.email.toLowerCase(),
            branchId: new mongoose_1.Types.ObjectId(employeeData.branchId),
            authProvider: 'local',
            isEmailVerified: true,
        }).save();
    }
    async deleteFreshEmployee(id) {
        await user_model_1.User.deleteOne({ _id: id, lastLoginAt: { $exists: false } }).exec();
    }
    async update(id, data, revokeSessions) {
        const $set = {};
        const $unset = {};
        for (const [key, value] of Object.entries(data)) {
            if (value === undefined)
                continue;
            if (value === null) {
                $unset[key] = 1;
            }
            else if (key === 'branchId') {
                $set[key] = new mongoose_1.Types.ObjectId(String(value));
            }
            else if (key === 'email') {
                $set[key] = String(value).toLowerCase();
            }
            else {
                $set[key] = value;
            }
        }
        const update = {};
        if (Object.keys($set).length > 0)
            update.$set = $set;
        if (Object.keys($unset).length > 0)
            update.$unset = $unset;
        if (revokeSessions)
            update.$inc = { refreshTokenVersion: 1 };
        return user_model_1.User.findByIdAndUpdate(id, update, { new: true, runValidators: true })
            .select(employeeProjection)
            .populate('branchId', 'name code address status')
            .exec();
    }
}
exports.EmployeeRepository = EmployeeRepository;
exports.employeeRepository = new EmployeeRepository();
//# sourceMappingURL=employee.repository.js.map