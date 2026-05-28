"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateVenueSchema = exports.createVenueSchema = void 0;
const zod_1 = require("zod");
exports.createVenueSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Tên sân là bắt buộc').trim(),
    description: zod_1.z.string().optional(),
    location: zod_1.z.string().min(1, 'Địa chỉ là bắt buộc').trim(),
    latitude: zod_1.z.number().optional(),
    longitude: zod_1.z.number().optional(),
    pricePerHour: zod_1.z.number().min(0, 'Giá phải lớn hơn 0'),
    openTime: zod_1.z.string().regex(/^\d{2}:\d{2}$/, 'Định dạng giờ không hợp lệ'),
    closeTime: zod_1.z.string().regex(/^\d{2}:\d{2}$/, 'Định dạng giờ không hợp lệ'),
    imageUrl: zod_1.z.string().optional(),
});
exports.updateVenueSchema = exports.createVenueSchema.partial();
//# sourceMappingURL=venue.validation.js.map