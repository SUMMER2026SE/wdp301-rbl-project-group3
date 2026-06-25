import mongoose, { Document, Schema, Types } from 'mongoose';

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'delivering'
  | 'delivered'
  | 'cancelled';

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
  orderType?: 'online' | 'offline';
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

const OrderItemSchema = new Schema<IOrderItem>(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    subtotal: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const OrderSchema = new Schema<IOrder>(
  {
    code: { type: String, required: true, unique: true, trim: true },
    customerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    branchId: { type: Schema.Types.ObjectId, ref: 'Branch', required: true },
    items: { type: [OrderItemSchema], required: true },
    totalAmount: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'preparing', 'delivering', 'delivered', 'cancelled'],
      default: 'pending',
    },
    orderType: {
      type: String,
      enum: ['online', 'offline'],
      default: 'online',
    },
    deliveryAddress: { type: String, trim: true },
    phoneNumber: { type: String, trim: true },
    paymentMethod: {
      type: String,
      enum: ['COD', 'banking', 'momo', 'vnpay'],
      default: 'COD',
    },
    note: { type: String, trim: true },
    confirmedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    confirmedAt: { type: Date },
    invoiceId: { type: Schema.Types.ObjectId, ref: 'Invoice' },
    invoiceReservationAt: { type: Date },
    invoiceIssuedAt: { type: Date },
    returnMutationLockedAt: { type: Date },
    returnMutationLockId: { type: String },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

OrderSchema.index({ code: 1 });
OrderSchema.index({ customerId: 1, createdAt: -1 });
OrderSchema.index({ branchId: 1, status: 1 });

export const Order = mongoose.model<IOrder>('Order', OrderSchema);
