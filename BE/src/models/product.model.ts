import mongoose, { Document, Schema, Types } from 'mongoose';

/**
 * Minimal Product model — phần đầy đủ do Developer A (UC15) sở hữu.
 * Chỉ khai báo các field cần thiết cho luồng cart & order của Developer B.
 */
export interface IProduct extends Document {
    _id: Types.ObjectId;
    productName: string;
    categoryId: Types.ObjectId;
    price: number;
    unit?: string;
    barcode?: string;
    status: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const ProductSchema = new Schema<IProduct>(
    {
        productName: { type: String, required: true, trim: true },
        categoryId: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
        price: { type: Number, required: true },
        unit: { type: String },
        barcode: { type: String, unique: true, sparse: true },
        status: { type: Boolean, default: true },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

ProductSchema.index({ status: 1 });

export const Product = mongoose.model<IProduct>('Product', ProductSchema);
