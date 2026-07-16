"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bannerController = exports.BannerController = void 0;
const banner_service_1 = require("./banner.service");
const banner_validation_1 = require("./banner.validation");
const asyncHandler_1 = require("../../utils/asyncHandler");
const response_util_1 = require("../../utils/response.util");
class BannerController {
    constructor() {
        this.list = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { query } = banner_validation_1.listBannersSchema.parse({
                query: req.query,
                body: req.body,
                params: req.params,
            });
            const page = query.page || 1;
            const limit = query.limit || 20;
            const result = await banner_service_1.bannerService.listBanners({ status: query.status }, page, limit);
            (0, response_util_1.sendSuccess)(res, result, 'Banners retrieved');
        });
        this.getActive = (0, asyncHandler_1.asyncHandler)(async (_req, res) => {
            const banners = await banner_service_1.bannerService.getActiveBanners();
            (0, response_util_1.sendSuccess)(res, { banners }, 'Active banners retrieved');
        });
        this.getById = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const banner = await banner_service_1.bannerService.getBannerById(String(req.params.id));
            (0, response_util_1.sendSuccess)(res, { banner }, 'Banner retrieved');
        });
        this.create = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const fileData = req.file
                ? { buffer: req.file.buffer, mimetype: req.file.mimetype }
                : undefined;
            const creatorId = req.user?.userId;
            const banner = await banner_service_1.bannerService.createBanner(req.body, fileData, creatorId);
            (0, response_util_1.sendSuccess)(res, { banner }, 'Banner created', 201);
        });
        this.update = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const fileData = req.file
                ? { buffer: req.file.buffer, mimetype: req.file.mimetype }
                : undefined;
            const banner = await banner_service_1.bannerService.updateBanner(String(req.params.id), req.body, fileData);
            (0, response_util_1.sendSuccess)(res, { banner }, 'Banner updated');
        });
        this.delete = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const banner = await banner_service_1.bannerService.deleteBanner(String(req.params.id));
            (0, response_util_1.sendSuccess)(res, { banner }, 'Banner deleted');
        });
    }
}
exports.BannerController = BannerController;
exports.bannerController = new BannerController();
//# sourceMappingURL=banner.controller.js.map