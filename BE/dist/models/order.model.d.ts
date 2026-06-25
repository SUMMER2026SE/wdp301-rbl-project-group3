import mongoose, { Document, Types } from 'mongoose';
export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'delivering' | 'delivered' | 'cancelled';
export type PaymentMethod = 'COD' | 'banking' | 'momo' | 'vnpay';
export interface IOrderItem {
    productId: Types.ObjectId;
    quantity: number;
    unitPrice: number;
    subtotal: number;
}
export interface IOrder extends Document {
    _id: Types.ObjectId;
    code: string;
    customerId: Types.ObjectId;
    branchId: Types.ObjectId;
    items: IOrderItem[];
    totalAmount: number;
    status: OrderStatus;
    deliveryAddress?: string;
    phoneNumber?: string;
    paymentMethod?: PaymentMethod;
    note?: string;
    confirmedBy?: Types.ObjectId;
    confirmedAt?: Date;
    invoiceId?: Types.ObjectId;
    invoiceReservationAt?: Date;
    invoiceIssuedAt?: Date;
    returnMutationLockedAt?: Date;
    returnMutationLockId?: string;
    createdAt: Date;
    updatedAt: Date;
}
export declare const Order: mongoose.Model<IOrder, {}, {}, {}, mongoose.Document<unknown, {}, IOrder, {}, mongoose.DefaultSchemaOptions> & IOrder & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IOrder>;
//# sourceMappingURL=order.model.d.ts.map