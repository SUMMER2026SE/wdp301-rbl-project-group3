import mongoose, { Document, Types } from 'mongoose';
export type ProductStatus = 'active' | 'inactive';
export interface IProduct extends Document {
    _id: Types.ObjectId;
    name: string;
    sku: string;
    description?: string;
    categoryId?: Types.ObjectId;
    unit: string;
    salePrice: number;
    imageUrl?: string;
    status: ProductStatus;
    createdAt: Date;
    updatedAt: Date;
}
export declare const Product: mongoose.Model<IProduct, {}, {}, {}, mongoose.Document<unknown, {}, IProduct, {}, mongoose.DefaultSchemaOptions> & IProduct & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IProduct>;
//# sourceMappingURL=product.model.d.ts.map