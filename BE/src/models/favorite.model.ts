import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IFavorite extends Document {
    _id: Types.ObjectId;
    userId: Types.ObjectId;
    productId: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const FavoriteSchema = new Schema<IFavorite>(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

// Compound index to ensure uniqueness of favorite record per user/product
FavoriteSchema.index({ userId: 1, productId: 1 }, { unique: true });

export const Favorite = mongoose.model<IFavorite>('Favorite', FavoriteSchema);
