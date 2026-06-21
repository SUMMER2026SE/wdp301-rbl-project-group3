import mongoose, { Document, Types } from 'mongoose';
export interface IInventory extends Document {
    _id: Types.ObjectId;
    branchId: Types.ObjectId;
    productId: Types.ObjectId;
    quantity: number;
    averageCost: number;
    lastImportCost?: number;
    lowStockThreshold: number;
    updatedBy?: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}
export declare const Inventory: mongoose.Model<IInventory, {}, {}, {}, mongoose.Document<unknown, {}, IInventory, {}, mongoose.DefaultSchemaOptions> & IInventory & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IInventory>;
//# sourceMappingURL=inventory.model.d.ts.map