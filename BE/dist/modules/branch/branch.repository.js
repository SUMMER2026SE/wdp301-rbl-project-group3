"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.branchRepository = exports.BranchRepository = void 0;
const branch_model_1 = require("../../models/branch.model");
class BranchRepository {
    async create(data) {
        return new branch_model_1.Branch(data).save();
    }
    async findAll(filters) {
        const query = {};
        if (filters.status)
            query.status = filters.status;
        if (filters.keyword) {
            query.$or = [
                { name: { $regex: filters.keyword, $options: 'i' } },
                { code: { $regex: filters.keyword, $options: 'i' } },
                { address: { $regex: filters.keyword, $options: 'i' } },
            ];
        }
        return branch_model_1.Branch.find(query).sort({ createdAt: -1 }).exec();
    }
    async findById(id) {
        return branch_model_1.Branch.findById(id).exec();
    }
    async findByCode(code) {
        return branch_model_1.Branch.findOne({ code: code.toUpperCase() }).exec();
    }
    async updateById(id, data) {
        return branch_model_1.Branch.findByIdAndUpdate(id, data, { new: true }).exec();
    }
}
exports.BranchRepository = BranchRepository;
exports.branchRepository = new BranchRepository();
//# sourceMappingURL=branch.repository.js.map