import mongoose, { Document, Types } from 'mongoose';
export interface IShiftTemplate extends Document {
    _id: Types.ObjectId;
    branchId: Types.ObjectId;
    name: string;
    startTime: string;
    endTime: string;
    maxStaff: number;
    status: 'active' | 'inactive';
    createdBy: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}
export declare const ShiftTemplate: mongoose.Model<IShiftTemplate, {}, {}, {}, mongoose.Document<unknown, {}, IShiftTemplate, {}, mongoose.DefaultSchemaOptions> & IShiftTemplate & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IShiftTemplate>;
//# sourceMappingURL=shift-template.model.d.ts.map