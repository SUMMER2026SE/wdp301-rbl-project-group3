"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.venueService = exports.VenueService = void 0;
const venue_repository_1 = require("./venue.repository");
const mongoose_1 = require("mongoose");
class VenueService {
    async createVenue(ownerId, data) {
        const venue = await venue_repository_1.venueRepository.create({
            ...data,
            ownerId: new mongoose_1.Types.ObjectId(ownerId),
        });
        return venue;
    }
    async getVenueById(id) {
        const venue = await venue_repository_1.venueRepository.findById(id);
        if (!venue) {
            throw new Error('Sân không tồn tại');
        }
        return venue;
    }
    async getVenuesByOwnerId(ownerId) {
        const id = typeof ownerId === 'string' ? new mongoose_1.Types.ObjectId(ownerId) : ownerId;
        return await venue_repository_1.venueRepository.findByOwnerId(id);
    }
    async getAllVenues() {
        return await venue_repository_1.venueRepository.findAll({ status: 'active' });
    }
    async updateVenue(id, ownerId, data) {
        const ownerId_obj = typeof ownerId === 'string' ? new mongoose_1.Types.ObjectId(ownerId) : ownerId;
        const venue = await venue_repository_1.venueRepository.findByIdAndOwnerId(id, ownerId_obj);
        if (!venue) {
            throw new Error('Sân không tồn tại hoặc bạn không có quyền chỉnh sửa');
        }
        const updated = await venue_repository_1.venueRepository.update(id, data);
        return updated;
    }
    async deleteVenue(id, ownerId) {
        const ownerId_obj = typeof ownerId === 'string' ? new mongoose_1.Types.ObjectId(ownerId) : ownerId;
        const venue = await venue_repository_1.venueRepository.findByIdAndOwnerId(id, ownerId_obj);
        if (!venue) {
            throw new Error('Sân không tồn tại hoặc bạn không có quyền xóa');
        }
        const deleted = await venue_repository_1.venueRepository.delete(id);
        return deleted;
    }
}
exports.VenueService = VenueService;
exports.venueService = new VenueService();
//# sourceMappingURL=venue.service.js.map