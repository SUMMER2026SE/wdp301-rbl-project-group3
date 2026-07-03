import { Types } from 'mongoose';
import { shiftRepository, RegistrationFilters } from './shift.repository';
import { IShiftTemplate } from '../../models/shift-template.model';
import { IShiftRegistration } from '../../models/shift-registration.model';
import { AppError } from '../../middlewares/errorHandler.middleware';

export interface ShiftActor {
  userId: string;
  role: 'customer' | 'admin' | 'branch_manager' | 'staff';
  branchId?: string;
}

export class ShiftService {
  private getMidnightDate(dateStr: string): Date {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) {
      throw new AppError('Invalid date format', 400);
    }
    // Set to midnight UTC or Local to normalize
    d.setHours(0, 0, 0, 0);
    return d;
  }

  // --- Shift Templates ---
  async createTemplate(actor: ShiftActor, data: any): Promise<IShiftTemplate> {
    if (actor.role === 'staff' || actor.role === 'customer') {
      throw new AppError('Permission denied', 403);
    }

    let branchId = data.branchId;
    if (actor.role === 'branch_manager') {
      branchId = actor.branchId;
    }

    if (!branchId) {
      throw new AppError('branchId is required', 400);
    }

    const payload = {
      branchId: new Types.ObjectId(branchId),
      name: data.name,
      startTime: data.startTime,
      endTime: data.endTime,
      maxStaff: data.maxStaff ?? 3,
      status: 'active' as const,
      createdBy: new Types.ObjectId(actor.userId),
    };

    return shiftRepository.createTemplate(payload);
  }

  async getTemplates(actor: ShiftActor, requestedBranchId?: string): Promise<IShiftTemplate[]> {
    let branchId = requestedBranchId;

    if (actor.role === 'branch_manager' || actor.role === 'staff') {
      branchId = actor.branchId;
    }

    if (!branchId) {
      throw new AppError('branchId is required', 400);
    }

    const includeInactive = actor.role === 'admin' || actor.role === 'branch_manager';
    return shiftRepository.findTemplatesByBranch(branchId, includeInactive);
  }

  async updateTemplate(actor: ShiftActor, id: string, data: any): Promise<IShiftTemplate> {
    if (actor.role === 'staff' || actor.role === 'customer') {
      throw new AppError('Permission denied', 403);
    }

    const template = await shiftRepository.findTemplateById(id);
    if (!template) {
      throw new AppError('Shift template not found', 404);
    }

    if (actor.role === 'branch_manager' && template.branchId.toString() !== actor.branchId) {
      throw new AppError('You can only modify templates of your own branch', 403);
    }

    const updated = await shiftRepository.updateTemplate(id, data);
    if (!updated) {
      throw new AppError('Failed to update template', 500);
    }

    return updated;
  }

  async deleteTemplate(actor: ShiftActor, id: string): Promise<void> {
    if (actor.role === 'staff' || actor.role === 'customer') {
      throw new AppError('Permission denied', 403);
    }

    const template = await shiftRepository.findTemplateById(id);
    if (!template) {
      throw new AppError('Shift template not found', 404);
    }

    if (actor.role === 'branch_manager' && template.branchId.toString() !== actor.branchId) {
      throw new AppError('You can only delete templates of your own branch', 403);
    }

    await shiftRepository.deleteTemplate(id);
  }

  // --- Shift Registrations ---
  async registerShift(actor: ShiftActor, data: { date: string; shiftTemplateId: string; note?: string }): Promise<IShiftRegistration> {
    const branchId = actor.branchId;
    if (!branchId) {
      throw new AppError('You must be assigned to a branch to register for shifts', 403);
    }

    const template = await shiftRepository.findTemplateById(data.shiftTemplateId);
    if (!template || template.status !== 'active') {
      throw new AppError('Active shift template not found', 404);
    }

    if (template.branchId.toString() !== branchId) {
      throw new AppError('You can only register for shifts in your assigned branch', 403);
    }

    const date = this.getMidnightDate(data.date);

    // Conflict check
    const existing = await shiftRepository.findConflictingRegistration(actor.userId, date, data.shiftTemplateId);
    if (existing) {
      throw new AppError('You have already registered for this shift on this date', 400);
    }

    const payload = {
      userId: new Types.ObjectId(actor.userId),
      branchId: new Types.ObjectId(branchId),
      date,
      shiftTemplateId: template._id,
      shiftName: template.name,
      startTime: template.startTime,
      endTime: template.endTime,
      status: 'pending' as const,
      note: data.note,
    };

    return shiftRepository.createRegistration(payload);
  }

  async getRegistrations(
    actor: ShiftActor,
    filters: { branchId?: string; userId?: string; startDate?: string; endDate?: string; status?: string }
  ): Promise<IShiftRegistration[]> {
    const repositoryFilters: RegistrationFilters = {
      status: filters.status,
    };

    if (actor.role === 'staff') {
      repositoryFilters.userId = actor.userId;
      repositoryFilters.branchId = actor.branchId;
    } else if (actor.role === 'branch_manager') {
      repositoryFilters.branchId = actor.branchId;
      repositoryFilters.userId = filters.userId; // manager can query specific employee in their branch
    } else {
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

    return shiftRepository.findRegistrations(repositoryFilters);
  }

  async cancelRegistration(actor: ShiftActor, id: string): Promise<void> {
    const registration = await shiftRepository.findRegistrationById(id);
    if (!registration) {
      throw new AppError('Shift registration not found', 404);
    }

    // Role bounds check
    if (actor.role === 'staff') {
      if (registration.userId._id.toString() !== actor.userId) {
        throw new AppError('You can only cancel your own registrations', 403);
      }
      if (registration.status !== 'pending') {
        throw new AppError('You can only cancel pending shift registrations', 400);
      }
    } else if (actor.role === 'branch_manager') {
      if (registration.branchId.toString() !== actor.branchId) {
        throw new AppError('You can only manage registrations of your own branch', 403);
      }
    }

    await shiftRepository.deleteRegistration(id);
  }

  async reviewRegistration(
    actor: ShiftActor,
    id: string,
    data: { status: 'approved' | 'rejected'; managerNote?: string }
  ): Promise<IShiftRegistration> {
    if (actor.role === 'staff' || actor.role === 'customer') {
      throw new AppError('Permission denied', 403);
    }

    const registration = await shiftRepository.findRegistrationById(id);
    if (!registration) {
      throw new AppError('Shift registration not found', 404);
    }

    if (actor.role === 'branch_manager' && registration.branchId.toString() !== actor.branchId) {
      throw new AppError('You can only review registrations of your own branch', 403);
    }

    if (registration.status !== 'pending') {
      throw new AppError('Registration has already been reviewed', 400);
    }

    if (data.status === 'approved') {
      // Limit check
      const template = await shiftRepository.findTemplateById(registration.shiftTemplateId.toString());
      const maxStaff = template?.maxStaff ?? 3;
      const approvedCount = await shiftRepository.countApprovedRegistrations(registration.date, registration.shiftTemplateId.toString());

      if (approvedCount >= maxStaff) {
        throw new AppError(`This shift is full. Limit is ${maxStaff} staff.`, 400);
      }
    }

    const updated = await shiftRepository.updateRegistrationStatus(id, data.status, data.managerNote, actor.userId);
    if (!updated) {
      throw new AppError('Failed to update registration status', 500);
    }

    return updated;
  }
}

export const shiftService = new ShiftService();
