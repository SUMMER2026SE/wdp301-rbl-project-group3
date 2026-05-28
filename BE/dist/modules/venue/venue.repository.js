"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.venueRepository = exports.VenueRepository = void 0;
const venue_model_1 = require("../../models/venue.model");
class VenueRepository {
    async create(data) {
        const venue = new venue_model_1.Venue(data);
        return await venue.save();
    }
    async findById(id) {
        return await venue_model_1.Venue.findById(id).populate('ownerId', 'fullName email phone');
    }
    async findByOwnerId(ownerId) {
        return await venue_model_1.Venue.find({ ownerId }).sort({ createdAt: -1 });
    }
    async findAll(filter) {
        return await venue_model_1.Venue.find(filter || {}).sort({ createdAt: -1 });
    }
    async update(id, data) {
        return await venue_model_1.Venue.findByIdAndUpdate(id, data, { new: true });
    }
    async delete(id) {
        const result = await venue_model_1.Venue.findByIdAndDelete(id);
        return !!result;
    }
    async findByIdAndOwnerId(id, ownerId) {
        return await venue_model_1.Venue.findOne({ _id: id, ownerId });
    }
}
exports.VenueRepository = VenueRepository;
exports.venueRepository = new VenueRepository();
//# sourceMappingURL=venue.repository.js.map