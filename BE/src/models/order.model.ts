import mongoose, { Document, Schema, Types } from 'mongoose';

// ─── Order status enum ───────────────────────────────────────────────────────
export type OrderStatus = 'pending' | 'confirmed' | 'shipping' | 'completed' | 'cancelled';

// ─── Payment method / status ─────────────────────────────────────────────────
export type PaymentMethod = 'COD' | 'banking' | 'momo' | 'vnpay';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

// ─── OrderDetail (embedded) ──────────────────────────────────────────────────
export interface IOrderDetail {
    _id: Types.ObjectId;
    productId: Types.ObjectId;
    productName: string;   // snapshot tên lúc mua
    quantity: number;
    price: number;         // snapshot giá lúc mua
}

const OrderDetailSchema = new Schema<IOrderDetail>(
    {
        productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
        productName: { type: String, required: true },
        quantity: { type: Number, required: true, min: 1 },
        price: { type: Number, required: true },
    },
    { _id: true }
);

// ─── Order ───────────────────────────────────────────────────────────────────
export interface IOrder extends Document {
    _id: Types.ObjectId;
    userId: Types.ObjectId;
    branchId: Types.ObjectId;
    orderDate: Date;
    totalAmount: number;
    status: OrderStatus;
    shippingAddress: string;
    phoneNumber: string;
    note?: string;
    paymentMethod: PaymentMethod;
    paymentStatus: PaymentStatus;
    items: IOrderDetail[];
    createdAt: Date;
    updatedAt: Date;
}

const OrderSchema = new Schema<IOrder>(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        branchId: { type: Schema.Types.ObjectId, ref: 'Branch', required: true },
        orderDate: { type: Date, default: () => new Date() },
        totalAmount: { type: Number, required: true },
        status: {
            type: String,
            enum: ['pending', 'confirmed', 'shipping', 'completed', 'cancelled'],
            default: 'pending',
        },
        shippingAddress: { type: String, required: true },
        phoneNumber: { type: String, required: true },
        note: { type: String },
        paymentMethod: {
            type: String,
            enum: ['COD', 'banking', 'momo', 'vnpay'],
            default: 'COD',
        },
        paymentStatus: {
            type: String,
            enum: ['pending', 'paid', 'failed', 'refunded'],
            default: 'pending',
        },
        items: { type: [OrderDetailSchema], required: true },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

OrderSchema.index({ userId: 1, createdAt: -1 });
OrderSchema.index({ branchId: 1, status: 1 });
OrderSchema.index({ status: 1 });

export const Order = mongoose.model<IOrder>('Order', OrderSchema);
