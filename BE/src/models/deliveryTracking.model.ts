import mongoose, { Document, Schema, Types } from 'mongoose';

// Mapping với OrderStatus 
export type TrackingStatus =
    | 'order_placed'   // tự động khi customer tạo đơn 
    | 'confirmed'      // staff confirm
    | 'preparing'      // staff preparing
    | 'delivering'     // staff delivering
    | 'delivered'      // staff delivered
    | 'cancelled';     // customer hoặc staff cancel

export interface IDeliveryTracking extends Document {
    _id: Types.ObjectId;
    orderId: Types.ObjectId;
    status: TrackingStatus;
    location?: string;
    note?: string;
    createdAt: Date;
    updatedAt: Date;
}

const DeliveryTrackingSchema = new Schema<IDeliveryTracking>(
    {
        orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true },
        status: {
            type: String,
            enum: ['order_placed', 'confirmed', 'preparing', 'delivering', 'delivered', 'cancelled'],
            required: true,
        },
        location: { type: String, trim: true },
        note: { type: String, trim: true },
    },
    { timestamps: true, versionKey: false }
);

DeliveryTrackingSchema.index({ orderId: 1, createdAt: 1 });

export const DeliveryTracking = mongoose.model<IDeliveryTracking>(
    'DeliveryTracking',
    DeliveryTrackingSchema
);
