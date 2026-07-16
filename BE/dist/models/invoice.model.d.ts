import mongoose, { Document, Types } from 'mongoose';
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
export declare const Invoice: mongoose.Model<IInvoice, {}, {}, {}, mongoose.Document<unknown, {}, IInvoice, {}, mongoose.DefaultSchemaOptions> & IInvoice & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IInvoice>;
//# sourceMappingURL=invoice.model.d.ts.map