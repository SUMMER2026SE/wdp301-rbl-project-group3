import mongoose, { Document, Types } from 'mongoose';
import { DiscountType } from './promotion.model';
export type VoucherStatus = 'active' | 'used' | 'expired' | 'disabled';
export interface IVoucherClaim {
    userId: Types.ObjectId;
    status: 'active' | 'used';
    claimedAt: Date;
    usedAt?: Date;
    orderId?: Types.ObjectId;
}
export interface IVoucher extends Document {
    _id: Types.ObjectId;
    code: string;
    promotionId: Types.ObjectId;
    discountType: DiscountType;
    discountValue: number;
    maxDiscountAmount?: number;
    minOrderAmount?: number;
    pointCost: number;
    targetMemberLevel: 'all' | 'new' | 'bronze' | 'silver' | 'gold' | 'diamond';
    branchId?: Types.ObjectId;
    expiresAt: Date;
    status: VoucherStatus;
    usedBy?: Types.ObjectId;
    usedAt?: Date;
    orderId?: Types.ObjectId;
    claims?: IVoucherClaim[];
    createdBy: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}
export declare const Voucher: mongoose.Model<IVoucher, {}, {}, {}, mongoose.Document<unknown, {}, IVoucher, {}, mongoose.DefaultSchemaOptions> & IVoucher & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IVoucher>;
//# sourceMappingURL=voucher.model.d.ts.map