"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const venue_controller_1 = require("./venue.controller");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const router = (0, express_1.Router)();
// Public routes
router.get('/', venue_controller_1.venueController.getAllVenues);
router.get('/:id', venue_controller_1.venueController.getVenueById);
// Protected routes
router.post('/', auth_middleware_1.authenticate, venue_controller_1.venueController.createVenue);
router.get('/owner/my-venues', auth_middleware_1.authenticate, venue_controller_1.venueController.getMyVenues);
router.put('/:id', auth_middleware_1.authenticate, venue_controller_1.venueController.updateVenue);
router.delete('/:id', auth_middleware_1.authenticate, venue_controller_1.venueController.deleteVenue);
exports.default = router;
//# sourceMappingURL=venue.routes.js.map