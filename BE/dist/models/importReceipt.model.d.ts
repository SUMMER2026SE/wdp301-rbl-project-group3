import mongoose, { Document, Types } from 'mongoose';
export interface IImportReceiptItem {
    productId: Types.ObjectId;
    quantity: number;
    unitCost: number;
    subtotal: number;
    appliedInventoryQuantity?: number;
    appliedAverageCost?: number;
}
export interface IImportReceipt extends Document {
    _id: Types.ObjectId;
    code: string;
    branchId: Types.ObjectId;
    supplierName?: string;
    note?: string;
    items: IImportReceiptItem[];
    totalCost: number;
    createdBy: Types.ObjectId;
    updatedBy?: Types.ObjectId;
    status: 'active' | 'adjusting' | 'cancelled';
    mutationLockedAt?: Date;
    cancelledBy?: Types.ObjectId;
    cancelledAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
export declare const ImportReceipt: mongoose.Model<IImportReceipt, {}, {}, {}, mongoose.Document<unknown, {}, IImportReceipt, {}, mongoose.DefaultSchemaOptions> & IImportReceipt & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IImportReceipt>;
//# sourceMappingURL=importReceipt.model.d.ts.map