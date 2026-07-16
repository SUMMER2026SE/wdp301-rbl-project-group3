import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IInvoiceItem {
  productId: Types.ObjectId;
  productName: string;
  sku?: string;
  unit?: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface IInvoice extends Document {
  _id: Types.ObjectId;
  invoiceNumber: string;
  orderId: Types.ObjectId;
  orderCode: string;
  branchId: Types.ObjectId;
  branchName: string;
  branchCode: string;
  branchAddress: string;
  branchPhone?: string;
  customerId: Types.ObjectId;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  deliveryAddress?: string;
  items: IInvoiceItem[];
  listedAmount: number;
  discountAmount: number;
  totalAmount: number;
  issuedBy: Types.ObjectId;
  issuedByName: string;
  issuedByEmail?: string;
  issuedAt: Date;
  printCount: number;
  lastPrintedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const InvoiceItemSchema = new Schema<IInvoiceItem>(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    productName: { type: String, required: true, trim: true },
    sku: { type: String, trim: true },
    unit: { type: String, trim: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    subtotal: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const InvoiceSchema = new Schema<IInvoice>(
  {
    invoiceNumber: { type: String, required: true, unique: true, trim: true },
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true, unique: true },
    orderCode: { type: String, required: true, trim: true },
    branchId: { type: Schema.Types.ObjectId, ref: 'Branch', required: true },
    branchName: { type: String, required: true, trim: true },
    branchCode: { type: String, required: true, trim: true },
    branchAddress: { type: String, required: true, trim: true },
    branchPhone: { type: String, trim: true },
    customerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    customerName: { type: String, required: true, trim: true },
    customerEmail: { type: String, trim: true },
    customerPhone: { type: String, trim: true },
    deliveryAddress: { type: String, trim: true },
    items: { type: [InvoiceItemSchema], required: true },
    listedAmount: { type: Number, required: true, min: 0, default: 0 },
    discountAmount: { type: Number, required: true, min: 0, default: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    issuedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    issuedByName: { type: String, required: true, trim: true },
    issuedByEmail: { type: String, trim: true },
    issuedAt: { type: Date, required: true, default: Date.now },
    printCount: { type: Number, required: true, min: 0, default: 0 },
    lastPrintedAt: { type: Date },
  },
  { timestamps: true, versionKey: false }
);

InvoiceSchema.index({ branchId: 1, issuedAt: -1 });
InvoiceSchema.index({ customerId: 1, issuedAt: -1 });

export const Invoice = mongoose.model<IInvoice>('Invoice', InvoiceSchema);
