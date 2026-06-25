import mongoose, { Document, Types } from 'mongoose';
export type BannerStatus = 'active' | 'inactive';
export interface IBanner extends Document {
    _id: Types.ObjectId;
    title: string;
    subtitle: string;
    description?: string;
    promoCode?: string;
    imageUrl: string;
    linkUrl?: string;
    status: BannerStatus;
    order: number;
    createdBy: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}
export declare const Banner: mongoose.Model<IBanner, {}, {}, {}, mongoose.Document<unknown, {}, IBanner, {}, mongoose.DefaultSchemaOptions> & IBanner & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IBanner>;
//# sourceMappingURL=banner.model.d.ts.map