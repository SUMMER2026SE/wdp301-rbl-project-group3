import mongoose, { Document, Types } from 'mongoose';
export interface IFlashSaleProduct {
    productId: Types.ObjectId;
    flashSalePrice: number;
    limitQuantity: number;
    soldQuantity: number;
}
export interface IFlashSale extends Document {
    _id: Types.ObjectId;
    name: string;
    description?: string;
    startDate: Date;
    endDate: Date;
    scope: 'global' | 'branch';
    branchId?: Types.ObjectId;
    products: IFlashSaleProduct[];
    status: 'draft' | 'active' | 'inactive' | 'expired';
    createdBy: Types.ObjectId;
    updatedBy?: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}
export declare const FlashSale: mongoose.Model<IFlashSale, {}, {}, {}, mongoose.Document<unknown, {}, IFlashSale, {}, mongoose.DefaultSchemaOptions> & IFlashSale & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IFlashSale>;
//# sourceMappingURL=flash-sale.model.d.ts.map