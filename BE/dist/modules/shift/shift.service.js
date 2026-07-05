"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.shiftService = exports.ShiftService = void 0;
const mongoose_1 = require("mongoose");
const shift_repository_1 = require("./shift.repository");
const errorHandler_middleware_1 = require("../../middlewares/errorHandler.middleware");
class ShiftService {
    getMidnightDate(dateStr) {
        const parts = dateStr.split('-');
        if (parts.length === 3) {
            const year = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10) - 1;
            const day = parseInt(parts[2], 10);
            return new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
        }
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) {
            throw new errorHandler_middleware_1.AppError('Invalid date format', 400);
        }
        return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
    }
    // --- Shift Templates ---
    async createTemplate(actor, data) {
        if (actor.role === 'staff' || actor.role === 'customer') {
            throw new errorHandler_middleware_1.AppError('Permission denied', 403);
        }
        let branchId = data.branchId;
        if (actor.role === 'branch_manager') {
            branchId = actor.branchId;
        }
        if (!branchId) {
            throw new errorHandler_middleware_1.AppError('branchId is required', 400);
        }
        const payload = {
            branchId: new mongoose_1.Types.ObjectId(branchId),
            name: data.name,
            startTime: data.startTime,
            endTime: data.endTime,
            maxStaff: data.maxStaff ?? 3,
            status: 'active',
            createdBy: new mongoose_1.Types.ObjectId(actor.userId),
        };
        return shift_repository_1.shiftRepository.createTemplate(payload);
    }
    async getTemplates(actor, requestedBranchId) {
        let branchId = requestedBranchId;
        if (actor.role === 'branch_manager' || actor.role === 'staff') {
            branchId = actor.branchId;
        }
        if (!branchId) {
            throw new errorHandler_middleware_1.AppError('branchId is required', 400);
        }
        const includeInactive = actor.role === 'admin' || actor.role === 'branch_manager';
        return shift_repository_1.shiftRepository.findTemplatesByBranch(branchId, includeInactive);
    }
    async updateTemplate(actor, id, data) {
        if (actor.role === 'staff' || actor.role === 'customer') {
            throw new errorHandler_middleware_1.AppError('Permission denied', 403);
        }
        const template = await shift_repository_1.shiftRepository.findTemplateById(id);
        if (!template) {
            throw new errorHandler_middleware_1.AppError('Shift template not found', 404);
        }
        if (actor.role === 'branch_manager' && template.branchId.toString() !== actor.branchId) {
            throw new errorHandler_middleware_1.AppError('You can only modify templates of your own branch', 403);
        }
        const updated = await shift_repository_1.shiftRepository.updateTemplate(id, data);
        if (!updated) {
            throw new errorHandler_middleware_1.AppError('Failed to update template', 500);
        }
        return updated;
    }
    async deleteTemplate(actor, id) {
        if (actor.role === 'staff' || actor.role === 'customer') {
            throw new errorHandler_middleware_1.AppError('Permission denied', 403);
        }
        const template = await shift_repository_1.shiftRepository.findTemplateById(id);
        if (!template) {
            throw new errorHandler_middleware_1.AppError('Shift template not found', 404);
        }
        if (actor.role === 'branch_manager' && template.branchId.toString() !== actor.branchId) {
            throw new errorHandler_middleware_1.AppError('You can only delete templates of your own branch', 403);
        }
        await shift_repository_1.shiftRepository.deleteTemplate(id);
    }
    // --- Shift Registrations ---
    async registerShift(actor, data) {
        const branchId = actor.branchId;
        if (!branchId) {
            throw new errorHandler_middleware_1.AppError('You must be assigned to a branch to register for shifts', 403);
        }
        const template = await shift_repository_1.shiftRepository.findTemplateById(data.shiftTemplateId);
        if (!template || template.status !== 'active') {
            throw new errorHandler_middleware_1.AppError('Active shift template not found', 404);
        }
        if (template.branchId.toString() !== branchId) {
            throw new errorHandler_middleware_1.AppError('You can only register for shifts in your assigned branch', 403);
        }
        const date = this.getMidnightDate(data.date);
        // Validate past dates using GMT+7 string comparison
        const todayStr = new Date(new Date().getTime() + 7 * 60 * 60 * 1000)
            .toISOString()
            .split('T')[0];
        if (data.date < todayStr) {
            throw new errorHandler_middleware_1.AppError('Cannot register for shifts in the past', 400);
        }
        // Conflict check
        const existing = await shift_repository_1.shiftRepository.findConflictingRegistration(actor.userId, date, data.shiftTemplateId);
        if (existing) {
            throw new errorHandler_middleware_1.AppError('You have already registered for this shift on this date', 400);
        }
        const payload = {
            userId: new mongoose_1.Types.ObjectId(actor.userId),
            branchId: new mongoose_1.Types.ObjectId(branchId),
            date,
            shiftTemplateId: template._id,
            shiftName: template.name,
            startTime: template.startTime,
            endTime: template.endTime,
            status: 'pending',
            note: data.note,
        };
        return shift_repository_1.shiftRepository.createRegistration(payload);
    }
    async getRegistrations(actor, filters) {
        const repositoryFilters = {
            status: filters.status,
        };
        if (actor.role === 'staff') {
            repositoryFilters.userId = actor.userId;
            repositoryFilters.branchId = actor.branchId;
        }
        else if (actor.role === 'branch_manager') {
            repositoryFilters.branchId = actor.branchId;
            repositoryFilters.userId = filters.userId; // manager can query specific employee in their branch
        }
        else {
            // Admin
            repositoryFilters.branchId = filters.branchId;
            repositoryFilters.userId = filters.userId;
        }
        if (filters.startDate) {
            repositoryFilters.startDate = this.getMidnightDate(filters.startDate);
        }
        if (filters.endDate) {
            repositoryFilters.endDate = this.getMidnightDate(filters.endDate);
        }
        return shift_repository_1.shiftRepository.findRegistrations(repositoryFilters);
    }
    async cancelRegistration(actor, id) {
        const registration = await shift_repository_1.shiftRepository.findRegistrationById(id);
        if (!registration) {
            throw new errorHandler_middleware_1.AppError('Shift registration not found', 404);
        }
        // Role bounds check
        if (actor.role === 'staff') {
            if (registration.userId._id.toString() !== actor.userId) {
                throw new errorHandler_middleware_1.AppError('You can only cancel your own registrations', 403);
            }
            if (registration.status !== 'pending') {
                throw new errorHandler_middleware_1.AppError('You can only cancel pending shift registrations', 400);
            }
            // Validate past cancellation using GMT+7 string comparison
            const todayStr = new Date(new Date().getTime() + 7 * 60 * 60 * 1000)
                .toISOString()
                .split('T')[0];
            const regDateStr = new Date(registration.date.getTime() + 7 * 60 * 60 * 1000)
                .toISOString()
                .split('T')[0];
            if (regDateStr < todayStr) {
                throw new errorHandler_middleware_1.AppError('Cannot cancel shifts in the past', 400);
            }
        }
        else if (actor.role === 'branch_manager') {
            if (registration.branchId.toString() !== actor.branchId) {
                throw new errorHandler_middleware_1.AppError('You can only manage registrations of your own branch', 403);
            }
        }
        await shift_repository_1.shiftRepository.deleteRegistration(id);
    }
    async reviewRegistration(actor, id, data) {
        if (actor.role === 'staff' || actor.role === 'customer') {
            throw new errorHandler_middleware_1.AppError('Permission denied', 403);
        }
        const registration = await shift_repository_1.shiftRepository.findRegistrationById(id);
        if (!registration) {
            throw new errorHandler_middleware_1.AppError('Shift registration not found', 404);
        }
        if (actor.role === 'branch_manager' && registration.branchId.toString() !== actor.branchId) {
            throw new errorHandler_middleware_1.AppError('You can only review registrations of your own branch', 403);
        }
        if (registration.status !== 'pending') {
            throw new errorHandler_middleware_1.AppError('Registration has already been reviewed', 400);
        }
        if (data.status === 'approved') {
            // Limit check
            const template = await shift_repository_1.shiftRepository.findTemplateById(registration.shiftTemplateId.toString());
            const maxStaff = template?.maxStaff ?? 3;
            const approvedCount = await shift_repository_1.shiftRepository.countApprovedRegistrations(registration.date, registration.shiftTemplateId.toString());
            if (approvedCount >= maxStaff) {
                throw new errorHandler_middleware_1.AppError(`This shift is full. Limit is ${maxStaff} staff.`, 400);
            }
        }
        const updated = await shift_repository_1.shiftRepository.updateRegistrationStatus(id, data.status, data.managerNote, actor.userId);
        if (!updated) {
            throw new errorHandler_middleware_1.AppError('Failed to update registration status', 500);
        }
        return updated;
    }
}
exports.ShiftService = ShiftService;
exports.shiftService = new ShiftService();
//# sourceMappingURL=shift.service.js.map