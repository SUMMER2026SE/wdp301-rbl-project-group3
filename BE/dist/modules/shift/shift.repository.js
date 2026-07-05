"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.shiftRepository = exports.ShiftRepository = void 0;
const mongoose_1 = require("mongoose");
const shift_template_model_1 = require("../../models/shift-template.model");
const shift_registration_model_1 = require("../../models/shift-registration.model");
class ShiftRepository {
    // --- Shift Templates ---
    async createTemplate(data) {
        const template = new shift_template_model_1.ShiftTemplate(data);
        return template.save();
    }
    async findTemplateById(id) {
        return shift_template_model_1.ShiftTemplate.findById(id).exec();
    }
    async findTemplatesByBranch(branchId, includeInactive = false) {
        const query = { branchId: new mongoose_1.Types.ObjectId(branchId) };
        if (!includeInactive) {
            query.status = 'active';
        }
        return shift_template_model_1.ShiftTemplate.find(query).sort({ startTime: 1 }).exec();
    }
    async updateTemplate(id, data) {
        return shift_template_model_1.ShiftTemplate.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true }).exec();
    }
    async deleteTemplate(id) {
        return shift_template_model_1.ShiftTemplate.findByIdAndDelete(id).exec();
    }
    // --- Shift Registrations ---
    async createRegistration(data) {
        const registration = new shift_registration_model_1.ShiftRegistration(data);
        return registration.save();
    }
    async findRegistrationById(id) {
        return shift_registration_model_1.ShiftRegistration.findById(id)
            .populate('userId', 'fullName email role phone')
            .populate('approvedBy', 'fullName email')
            .exec();
    }
    async findRegistrations(filters) {
        const query = {};
        if (filters.branchId) {
            query.branchId = new mongoose_1.Types.ObjectId(filters.branchId);
        }
        if (filters.userId) {
            query.userId = new mongoose_1.Types.ObjectId(filters.userId);
        }
        if (filters.status) {
            query.status = filters.status;
        }
        if (filters.startDate || filters.endDate) {
            query.date = {};
            if (filters.startDate) {
                query.date.$gte = filters.startDate;
            }
            if (filters.endDate) {
                query.date.$lte = filters.endDate;
            }
        }
        return shift_registration_model_1.ShiftRegistration.find(query)
            .populate('userId', 'fullName email role phone')
            .populate('approvedBy', 'fullName email')
            .sort({ date: 1, startTime: 1 })
            .exec();
    }
    async findConflictingRegistration(userId, date, shiftTemplateId) {
        return shift_registration_model_1.ShiftRegistration.findOne({
            userId: new mongoose_1.Types.ObjectId(userId),
            date,
            shiftTemplateId: new mongoose_1.Types.ObjectId(shiftTemplateId),
            status: { $ne: 'rejected' },
        }).exec();
    }
    async countApprovedRegistrations(date, shiftTemplateId) {
        return shift_registration_model_1.ShiftRegistration.countDocuments({
            date,
            shiftTemplateId: new mongoose_1.Types.ObjectId(shiftTemplateId),
            status: 'approved',
        }).exec();
    }
    async updateRegistrationStatus(id, status, managerNote, approvedBy) {
        const update = {
            status,
            approvedAt: new Date(),
        };
        if (managerNote !== undefined)
            update.managerNote = managerNote;
        if (approvedBy)
            update.approvedBy = new mongoose_1.Types.ObjectId(approvedBy);
        return shift_registration_model_1.ShiftRegistration.findByIdAndUpdate(id, { $set: update }, { new: true })
            .populate('userId', 'fullName email role phone')
            .populate('approvedBy', 'fullName email')
            .exec();
    }
    async deleteRegistration(id) {
        return shift_registration_model_1.ShiftRegistration.findByIdAndDelete(id).exec();
    }
}
exports.ShiftRepository = ShiftRepository;
exports.shiftRepository = new ShiftRepository();
//# sourceMappingURL=shift.repository.js.map