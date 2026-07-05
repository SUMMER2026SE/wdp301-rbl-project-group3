import { IShiftTemplate } from '../../models/shift-template.model';
import { IShiftRegistration } from '../../models/shift-registration.model';
export interface ShiftActor {
    userId: string;
    role: 'customer' | 'admin' | 'branch_manager' | 'staff';
    branchId?: string;
}
export declare class ShiftService {
    private getMidnightDate;
    createTemplate(actor: ShiftActor, data: any): Promise<IShiftTemplate>;
    getTemplates(actor: ShiftActor, requestedBranchId?: string): Promise<IShiftTemplate[]>;
    updateTemplate(actor: ShiftActor, id: string, data: any): Promise<IShiftTemplate>;
    deleteTemplate(actor: ShiftActor, id: string): Promise<void>;
    registerShift(actor: ShiftActor, data: {
        date: string;
        shiftTemplateId: string;
        note?: string;
    }): Promise<IShiftRegistration>;
    getRegistrations(actor: ShiftActor, filters: {
        branchId?: string;
        userId?: string;
        startDate?: string;
        endDate?: string;
        status?: string;
    }): Promise<IShiftRegistration[]>;
    cancelRegistration(actor: ShiftActor, id: string): Promise<void>;
    reviewRegistration(actor: ShiftActor, id: string, data: {
        status: 'approved' | 'rejected';
        managerNote?: string;
    }): Promise<IShiftRegistration>;
}
export declare const shiftService: ShiftService;
//# sourceMappingURL=shift.service.d.ts.map