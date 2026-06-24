import mongoose, { Document, Types } from 'mongoose';
export type TrackingStatus = 'order_placed' | 'confirmed' | 'preparing' | 'delivering' | 'delivered' | 'cancelled';
export interface IDeliveryTracking extends Document {
    _id: Types.ObjectId;
    orderId: Types.ObjectId;
    status: TrackingStatus;
    location?: string;
    note?: string;
    createdAt: Date;
    updatedAt: Date;
}
export declare const DeliveryTracking: mongoose.Model<IDeliveryTracking, {}, {}, {}, mongoose.Document<unknown, {}, IDeliveryTracking, {}, mongoose.DefaultSchemaOptions> & IDeliveryTracking & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IDeliveryTracking>;
//# sourceMappingURL=deliveryTracking.model.d.ts.map