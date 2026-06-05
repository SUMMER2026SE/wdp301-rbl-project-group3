import { CreateVenueInput, UpdateVenueInput } from './venue.validation';
import { Types } from 'mongoose';
export declare class VenueService {
    createVenue(ownerId: string, data: CreateVenueInput): Promise<import("../../models/venue.model").IVenue>;
    getVenueById(id: string): Promise<import("../../models/venue.model").IVenue>;
    getVenuesByOwnerId(ownerId: string | Types.ObjectId): Promise<import("../../models/venue.model").IVenue[]>;
    getAllVenues(): Promise<import("../../models/venue.model").IVenue[]>;
    updateVenue(id: string, ownerId: string | Types.ObjectId, data: UpdateVenueInput): Promise<import("../../models/venue.model").IVenue | null>;
    deleteVenue(id: string, ownerId: string | Types.ObjectId): Promise<boolean>;
}
export declare const venueService: VenueService;
//# sourceMappingURL=venue.service.d.ts.map