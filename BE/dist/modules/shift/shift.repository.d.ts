import { IShiftTemplate } from '../../models/shift-template.model';
import { IShiftRegistration } from '../../models/shift-registration.model';
export interface RegistrationFilters {
    branchId?: string;
    userId?: string;
    startDate?: Date;
    endDate?: Date;
    status?: string;
}
export declare class ShiftRepository {
    createTemplate(data: Partial<IShiftTemplate>): Promise<IShiftTemplate>;
    findTemplateById(id: string): Promise<IShiftTemplate | null>;
    findTemplatesByBranch(branchId: string, includeInactive?: boolean): Promise<IShiftTemplate[]>;
    updateTemplate(id: string, data: Partial<IShiftTemplate>): Promise<IShiftTemplate | null>;
    deleteTemplate(id: string): Promise<IShiftTemplate | null>;
    createRegistration(data: Partial<IShiftRegistration>): Promise<IShiftRegistration>;
    findRegistrationById(id: string): Promise<IShiftRegistration | null>;
    findRegistrations(filters: RegistrationFilters): Promise<IShiftRegistration[]>;
    findConflictingRegistration(userId: string, date: Date, shiftTemplateId: string): Promise<IShiftRegistration | null>;
    countApprovedRegistrations(date: Date, shiftTemplateId: string): Promise<number>;
    updateRegistrationStatus(id: string, status: 'approved' | 'rejected', managerNote?: string, approvedBy?: string): Promise<IShiftRegistration | null>;
    deleteRegistration(id: string): Promise<IShiftRegistration | null>;
}
export declare const shiftRepository: ShiftRepository;
//# sourceMappingURL=shift.repository.d.ts.map