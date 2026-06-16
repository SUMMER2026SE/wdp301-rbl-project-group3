import mongoose, { Document, Types } from 'mongoose';
export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'delivering' | 'delivered' | 'cancelled';
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
    note?: string;
    confirmedBy?: Types.ObjectId;
    confirmedAt?: Date;
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