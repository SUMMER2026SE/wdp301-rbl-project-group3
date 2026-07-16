"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const crawler_controller_1 = require("./crawler.controller");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const role_middleware_1 = require("../../middlewares/role.middleware");
const router = (0, express_1.Router)();
// Chỉ admin mới được quyền trigger cào dữ liệu thủ công
router.post('/start', auth_middleware_1.authenticate, (0, role_middleware_1.authorize)('admin'), crawler_controller_1.crawlerController.startManualCrawl);
router.post('/stop', auth_middleware_1.authenticate, (0, role_middleware_1.authorize)('admin'), crawler_controller_1.crawlerController.stopManualCrawl);
router.get('/status', auth_middleware_1.authenticate, (0, role_middleware_1.authorize)('admin'), crawler_controller_1.crawlerController.getCrawlerStatus);
exports.default = router;
//# sourceMappingURL=crawler.routes.js.map