import mongoose, { Document, Types } from 'mongoose';
export interface ICompetitorProduct extends Document {
    _id: Types.ObjectId;
    name: string;
    sku: string;
    description?: string;
    brand?: string;
    unit: string;
    price: number;
    imageUrl?: string;
    source: string;
    sourceUrl?: string;
    createdAt: Date;
    updatedAt: Date;
    normalizedName?: string;
    normalizedBrand?: string;
    normalizedUnit?: string;
}
export declare const CompetitorProduct: mongoose.Model<ICompetitorProduct, {}, {}, {}, mongoose.Document<unknown, {}, ICompetitorProduct, {}, mongoose.DefaultSchemaOptions> & ICompetitorProduct & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, ICompetitorProduct>;
//# sourceMappingURL=competitor-product.model.d.ts.map