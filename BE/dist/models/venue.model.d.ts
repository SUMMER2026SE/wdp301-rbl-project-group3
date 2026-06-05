import mongoose, { Document, Types } from 'mongoose';
export interface IVenue extends Document {
    _id: Types.ObjectId;
    ownerId: Types.ObjectId;
    name: string;
    description?: string;
    location: string;
    latitude?: number;
    longitude?: number;
    pricePerHour: number;
    openTime: string;
    closeTime: string;
    imageUrl?: string;
    status: 'active' | 'inactive';
    createdAt: Date;
    updatedAt: Date;
}
export declare const Venue: mongoose.Model<IVenue, {}, {}, {}, mongoose.Document<unknown, {}, IVenue, {}, mongoose.DefaultSchemaOptions> & IVenue & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IVenue>;
//# sourceMappingURL=venue.model.d.ts.map