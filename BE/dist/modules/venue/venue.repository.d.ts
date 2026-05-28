import { IVenue } from '../../models/venue.model';
import { Types } from 'mongoose';
export declare class VenueRepository {
    create(data: Partial<IVenue>): Promise<IVenue>;
    findById(id: string | Types.ObjectId): Promise<IVenue | null>;
    findByOwnerId(ownerId: string | Types.ObjectId): Promise<IVenue[]>;
    findAll(filter?: Record<string, any>): Promise<IVenue[]>;
    update(id: string | Types.ObjectId, data: Partial<IVenue>): Promise<IVenue | null>;
    delete(id: string | Types.ObjectId): Promise<boolean>;
    findByIdAndOwnerId(id: string | Types.ObjectId, ownerId: string | Types.ObjectId): Promise<IVenue | null>;
}
export declare const venueRepository: VenueRepository;
//# sourceMappingURL=venue.repository.d.ts.map