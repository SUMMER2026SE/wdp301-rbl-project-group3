import mongoose, { Document, Types } from 'mongoose';
export type CategoryStatus = 'active' | 'inactive';
export interface ICategory extends Document {
    _id: Types.ObjectId;
    name: string;
    code: string;
    description?: string;
    status: CategoryStatus;
    createdAt: Date;
    updatedAt: Date;
}
export declare const Category: mongoose.Model<ICategory, {}, {}, {}, mongoose.Document<unknown, {}, ICategory, {}, mongoose.DefaultSchemaOptions> & ICategory & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, ICategory>;
//# sourceMappingURL=category.model.d.ts.map