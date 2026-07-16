import mongoose, { Document, Types } from 'mongoose';
export type ReturnStatus = 'pending' | 'approved' | 'completing' | 'completed' | 'rejected' | 'cancelled';
export type ReturnItemCondition = 'resellable' | 'damaged' | 'expired';
export type RefundMethod = 'cash' | 'bank_transfer' | 'original_payment' | 'other';
export type RefundStatus = 'pending' | 'completed';
export interface IReturnItem {
    productId: Types.ObjectId;
    productName: string;
    quantity: number;
    unitPrice: number;
    refundAmount: number;
    condition: ReturnItemCondition;
}
export interface IReturnRequest extends Document {
    _id: Types.ObjectId;
    code: string;
    orderId: Types.ObjectId;
    orderCode: string;
    customerId: Types.ObjectId;
    customerName: string;
    customerEmail?: string;
    customerPhone?: string;
    branchId: Types.ObjectId;
    branchName: string;
    branchAddress: string;
    items: IReturnItem[];
    reason: string;
    totalRefund: number;
    status: ReturnStatus;
    createdBy: Types.ObjectId;
    reviewedBy?: Types.ObjectId;
    reviewedAt?: Date;
    resolutionNote?: string;
    completedBy?: Types.ObjectId;
    completedAt?: Date;
    completionLockId?: string;
    completionLockedAt?: Date;
    refundStatus: RefundStatus;
    refundMethod?: RefundMethod;
    refundReference?: string;
    refundedBy?: Types.ObjectId;
    refundedAt?: Date;
    cancelledBy?: Types.ObjectId;
    cancelledAt?: Date;
    cancellationReason?: string;
    createdAt: Date;
    updatedAt: Date;
}
export declare const ReturnRequest: mongoose.Model<IReturnRequest, {}, {}, {}, mongoose.Document<unknown, {}, IReturnRequest, {}, mongoose.DefaultSchemaOptions> & IReturnRequest & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IReturnRequest>;
//# sourceMappingURL=returnRequest.model.d.ts.map