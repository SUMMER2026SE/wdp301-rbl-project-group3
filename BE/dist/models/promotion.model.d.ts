import mongoose, { Document, Types } from 'mongoose';
export type DiscountType = 'percentage' | 'fixed_amount';
export type PromotionStatus = 'draft' | 'active' | 'inactive' | 'expired';
export type PromotionScope = 'global' | 'branch';
export interface IPromotion extends Document {
    _id: Types.ObjectId;
    name: string;
    description?: string;
    discountType: DiscountType;
    discountValue: number;
    maxDiscountAmount?: number;
    minOrderAmount?: number;
    pointCost: number;
    targetMemberLevel: 'all' | 'new' | 'bronze' | 'silver' | 'gold' | 'diamond';
    scope: PromotionScope;
    branchId?: Types.ObjectId;
    startDate: Date;
    endDate: Date;
    usageLimit?: number;
    usageCount: number;
    status: PromotionStatus;
    createdBy: Types.ObjectId;
    updatedBy?: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}
export declare const Promotion: mongoose.Model<IPromotion, {}, {}, {}, mongoose.Document<unknown, {}, IPromotion, {}, mongoose.DefaultSchemaOptions> & IPromotion & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IPromotion>;
//# sourceMappingURL=promotion.model.d.ts.map