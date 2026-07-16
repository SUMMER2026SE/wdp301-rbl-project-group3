import mongoose, { Document, Types } from 'mongoose';
export interface ICartItem {
    _id: Types.ObjectId;
    productId: Types.ObjectId;
    quantity: number;
    addedAt: Date;
}
export interface ICart extends Document {
    _id: Types.ObjectId;
    userId: Types.ObjectId;
    items: ICartItem[];
    createdAt: Date;
    updatedAt: Date;
}
export declare const Cart: mongoose.Model<ICart, {}, {}, {}, mongoose.Document<unknown, {}, ICart, {}, mongoose.DefaultSchemaOptions> & ICart & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, ICart>;
//# sourceMappingURL=cart.model.d.ts.map