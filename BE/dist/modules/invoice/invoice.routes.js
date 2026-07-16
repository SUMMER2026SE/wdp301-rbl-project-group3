"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const role_middleware_1 = require("../../middlewares/role.middleware");
const invoice_controller_1 = require("./invoice.controller");
const invoice_validation_1 = require("./invoice.validation");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate);
router.use((0, role_middleware_1.authorize)('admin', 'branch_manager', 'staff'));
router.post('/orders/:orderId', (0, invoice_validation_1.validate)(invoice_validation_1.invoiceOrderIdParamSchema), invoice_controller_1.invoiceController.issue);
router.get('/orders/:orderId', (0, invoice_validation_1.validate)(invoice_validation_1.invoiceOrderIdParamSchema), invoice_controller_1.invoiceController.getByOrder);
router.get('/:id/pdf', (0, invoice_validation_1.validate)(invoice_validation_1.invoiceIdParamSchema), invoice_controller_1.invoiceController.downloadPdf);
router.get('/:id', (0, invoice_validation_1.validate)(invoice_validation_1.invoiceIdParamSchema), invoice_controller_1.invoiceController.getById);
exports.default = router;
//# sourceMappingURL=invoice.routes.js.map