import { Types } from 'mongoose';
import { ShiftTemplate, IShiftTemplate } from '../../models/shift-template.model';
import { ShiftRegistration, IShiftRegistration } from '../../models/shift-registration.model';

export interface RegistrationFilters {
  branchId?: string;
  userId?: string;
  startDate?: Date;
  endDate?: Date;
  status?: string;
}

/**
 * Persistence gateway that centralizes database access for this domain.
 * Feature boundary: Shift.
 */
export class ShiftRepository {
  // --- Shift Templates ---
  async createTemplate(data: Partial<IShiftTemplate>): Promise<IShiftTemplate> {
    const template = new ShiftTemplate(data);
    return template.save();
  }

  async findTemplateById(id: string): Promise<IShiftTemplate | null> {
    return ShiftTemplate.findById(id).exec();
  }

  async findTemplatesByBranch(branchId: string, includeInactive = false): Promise<IShiftTemplate[]> {
    const query: Record<string, any> = { branchId: new Types.ObjectId(branchId) };
    if (!includeInactive) {
      query.status = 'active';
    }
    return ShiftTemplate.find(query).sort({ startTime: 1 }).exec();
  }

  async updateTemplate(id: string, data: Partial<IShiftTemplate>): Promise<IShiftTemplate | null> {
    return ShiftTemplate.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true }).exec();
  }

  async deleteTemplate(id: string): Promise<IShiftTemplate | null> {
    return ShiftTemplate.findByIdAndDelete(id).exec();
  }

  // --- Shift Registrations ---
  async createRegistration(data: Partial<IShiftRegistration>): Promise<IShiftRegistration> {
    const registration = new ShiftRegistration(data);
    return registration.save();
  }

  async findRegistrationById(id: string): Promise<IShiftRegistration | null> {
    return ShiftRegistration.findById(id)
      .populate('userId', 'fullName email role phone')
      .populate('approvedBy', 'fullName email')
      .exec();
  }

  async findRegistrations(filters: RegistrationFilters): Promise<IShiftRegistration[]> {
    const query: Record<string, any> = {};

    if (filters.branchId) {
      query.branchId = new Types.ObjectId(filters.branchId);
    }
    if (filters.userId) {
      query.userId = new Types.ObjectId(filters.userId);
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

    return ShiftRegistration.find(query)
      .populate('userId', 'fullName email role phone')
      .populate('approvedBy', 'fullName email')
      .sort({ date: 1, startTime: 1 })
      .exec();
  }

  async findConflictingRegistration(
    userId: string,
    date: Date,
    shiftTemplateId: string
  ): Promise<IShiftRegistration | null> {
    return ShiftRegistration.findOne({
      userId: new Types.ObjectId(userId),
      date,
      shiftTemplateId: new Types.ObjectId(shiftTemplateId),
      status: { $ne: 'rejected' },
    }).exec();
  }

  async countApprovedRegistrations(date: Date, shiftTemplateId: string): Promise<number> {
    return ShiftRegistration.countDocuments({
      date,
      shiftTemplateId: new Types.ObjectId(shiftTemplateId),
      status: 'approved',
    }).exec();
  }

  async updateRegistrationStatus(
    id: string,
    status: 'approved' | 'rejected',
    managerNote?: string,
    approvedBy?: string
  ): Promise<IShiftRegistration | null> {
    const update: Record<string, any> = {
      status,
      approvedAt: new Date(),
    };
    if (managerNote !== undefined) update.managerNote = managerNote;
    if (approvedBy) update.approvedBy = new Types.ObjectId(approvedBy);

    return ShiftRegistration.findByIdAndUpdate(id, { $set: update }, { new: true })
      .populate('userId', 'fullName email role phone')
      .populate('approvedBy', 'fullName email')
      .exec();
  }

  async deleteRegistration(id: string): Promise<IShiftRegistration | null> {
    return ShiftRegistration.findByIdAndDelete(id).exec();
  }
}

export const shiftRepository = new ShiftRepository();
/**
 * Encapsulates database queries for this module and keeps persistence details out of services.
 * Feature boundary: shift.
 */
/**
 * Business-support component for the shift feature.
 * It centralizes this concern so controllers and other modules reuse one consistent workflow.
 */
