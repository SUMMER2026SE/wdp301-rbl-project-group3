"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.venueController = exports.VenueController = void 0;
const venue_service_1 = require("./venue.service");
const venue_validation_1 = require("./venue.validation");
const asyncHandler_1 = require("../../utils/asyncHandler");
const response_util_1 = require("../../utils/response.util");
const errorHandler_middleware_1 = require("../../middlewares/errorHandler.middleware");
class VenueController {
    constructor() {
        this.createVenue = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const userId = req.user?.userId;
            if (!userId) {
                throw new errorHandler_middleware_1.AppError('Vui lòng đăng nhập', 401);
            }
            const validated = venue_validation_1.createVenueSchema.parse(req.body);
            const venue = await venue_service_1.venueService.createVenue(userId, validated);
            return (0, response_util_1.sendSuccess)(res, venue, 'Thêm sân thành công', 201);
        });
        this.getVenueById = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { id } = req.params;
            const venueId = Array.isArray(id) ? id[0] : id;
            const venue = await venue_service_1.venueService.getVenueById(venueId);
            return (0, response_util_1.sendSuccess)(res, venue, 'Lấy thông tin sân thành công');
        });
        this.getMyVenues = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const userId = req.user?.userId;
            if (!userId) {
                throw new errorHandler_middleware_1.AppError('Vui lòng đăng nhập', 401);
            }
            const venues = await venue_service_1.venueService.getVenuesByOwnerId(userId);
            return (0, response_util_1.sendSuccess)(res, venues, 'Lấy danh sách sân thành công');
        });
        this.getAllVenues = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const venues = await venue_service_1.venueService.getAllVenues();
            return (0, response_util_1.sendSuccess)(res, venues, 'Lấy danh sách sân thành công');
        });
        this.updateVenue = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const userId = req.user?.userId;
            if (!userId) {
                throw new errorHandler_middleware_1.AppError('Vui lòng đăng nhập', 401);
            }
            const { id } = req.params;
            const venueId = Array.isArray(id) ? id[0] : id;
            const validated = venue_validation_1.updateVenueSchema.parse(req.body);
            const venue = await venue_service_1.venueService.updateVenue(venueId, userId, validated);
            return (0, response_util_1.sendSuccess)(res, venue, 'Cập nhật sân thành công');
        });
        this.deleteVenue = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const userId = req.user?.userId;
            if (!userId) {
                throw new errorHandler_middleware_1.AppError('Vui lòng đăng nhập', 401);
            }
            const { id } = req.params;
            const venueId = Array.isArray(id) ? id[0] : id;
            await venue_service_1.venueService.deleteVenue(venueId, userId);
            return (0, response_util_1.sendSuccess)(res, null, 'Xóa sân thành công');
        });
    }
}
exports.VenueController = VenueController;
exports.venueController = new VenueController();
//# sourceMappingURL=venue.controller.js.map