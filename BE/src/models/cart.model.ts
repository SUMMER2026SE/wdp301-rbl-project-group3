import mongoose, { Document, Schema, Types } from 'mongoose';

// ─── CartItem (embedded sub-document) ───────────────────────────────────────
export interface ICartItem {
    _id: Types.ObjectId;
    productId: Types.ObjectId;
    quantity: number;
    addedAt: Date;
}

const CartItemSchema = new Schema<ICartItem>(
    {
        productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
        quantity: { type: Number, required: true, min: 1 },
        addedAt: { type: Date, default: () => new Date() },
    },
    { _id: true }
);

// ─── Cart ────────────────────────────────────────────────────────────────────
export interface ICart extends Document {
    _id: Types.ObjectId;
    userId: Types.ObjectId;
    items: ICartItem[];
    createdAt: Date;
    updatedAt: Date;
}

const CartSchema = new Schema<ICart>(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
        items: { type: [CartItemSchema], default: [] },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

CartSchema.index({ userId: 1 });

export const Cart = mongoose.model<ICart>('Cart', CartSchema);
