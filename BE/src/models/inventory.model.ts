import mongoose, { Document, Schema, Types } from 'mongoose';

/**
 * Minimal Inventory model — phần đầy đủ do Developer C (UC16) sở hữu.
 * Developer B chỉ cần đọc số lượng tồn kho để validate khi đặt hàng (UC09).
 */
export interface IInventory extends Document {
    _id: Types.ObjectId;
    branchId: Types.ObjectId;
    productId: Types.ObjectId;
    quantity: number;
    lastUpdated: Date;
}

const InventorySchema = new Schema<IInventory>(
    {
        branchId: { type: Schema.Types.ObjectId, ref: 'Branch', required: true },
        productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
        quantity: { type: Number, required: true, min: 0, default: 0 },
        lastUpdated: { type: Date, default: () => new Date() },
    },
    {
        timestamps: false,
        versionKey: false,
    }
);

InventorySchema.index({ branchId: 1, productId: 1 }, { unique: true });

export const Inventory = mongoose.model<IInventory>('Inventory', InventorySchema);
