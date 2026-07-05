import mongoose, { Document, Types } from 'mongoose';
export interface IShiftRegistration extends Document {
    _id: Types.ObjectId;
    userId: Types.ObjectId;
    branchId: Types.ObjectId;
    date: Date;
    shiftTemplateId: Types.ObjectId;
    shiftName: string;
    startTime: string;
    endTime: string;
    status: 'pending' | 'approved' | 'rejected';
    note?: string;
    managerNote?: string;
    approvedBy?: Types.ObjectId;
    approvedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
export declare const ShiftRegistration: mongoose.Model<IShiftRegistration, {}, {}, {}, mongoose.Document<unknown, {}, IShiftRegistration, {}, mongoose.DefaultSchemaOptions> & IShiftRegistration & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IShiftRegistration>;
//# sourceMappingURL=shift-registration.model.d.ts.map