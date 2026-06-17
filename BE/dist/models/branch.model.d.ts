import mongoose, { Document, Types } from 'mongoose';
export type BranchStatus = 'active' | 'inactive';
export interface IBranch extends Document {
    _id: Types.ObjectId;
    name: string;
    code: string;
    address: string;
    phone?: string;
    managerId?: Types.ObjectId;
    status: BranchStatus;
    createdAt: Date;
    updatedAt: Date;
}
export declare const Branch: mongoose.Model<IBranch, {}, {}, {}, mongoose.Document<unknown, {}, IBranch, {}, mongoose.DefaultSchemaOptions> & IBranch & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IBranch>;
//# sourceMappingURL=branch.model.d.ts.map