"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const shift_controller_1 = require("./shift.controller");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const role_middleware_1 = require("../../middlewares/role.middleware");
const shift_validation_1 = require("./shift.validation");
const router = (0, express_1.Router)();
// Apply auth to all shift routes
router.use(auth_middleware_1.authenticate);
// --- Shift Templates ---
router.post('/templates', (0, role_middleware_1.authorize)('admin', 'branch_manager'), (0, shift_validation_1.validate)(shift_validation_1.createShiftTemplateSchema), shift_controller_1.shiftController.createTemplate);
router.get('/templates', (0, role_middleware_1.authorize)('admin', 'branch_manager', 'staff'), shift_controller_1.shiftController.getTemplates);
router.put('/templates/:id', (0, role_middleware_1.authorize)('admin', 'branch_manager'), (0, shift_validation_1.validate)(shift_validation_1.updateShiftTemplateSchema), shift_controller_1.shiftController.updateTemplate);
router.delete('/templates/:id', (0, role_middleware_1.authorize)('admin', 'branch_manager'), shift_controller_1.shiftController.deleteTemplate);
// --- Shift Registrations ---
router.post('/registrations', (0, role_middleware_1.authorize)('staff', 'branch_manager', 'admin'), // staff register themselves
(0, shift_validation_1.validate)(shift_validation_1.registerShiftSchema), shift_controller_1.shiftController.registerShift);
router.get('/registrations', (0, role_middleware_1.authorize)('admin', 'branch_manager', 'staff'), shift_controller_1.shiftController.getRegistrations);
router.delete('/registrations/:id', (0, role_middleware_1.authorize)('admin', 'branch_manager', 'staff'), shift_controller_1.shiftController.cancelRegistration);
router.post('/registrations/:id/review', (0, role_middleware_1.authorize)('admin', 'branch_manager'), (0, shift_validation_1.validate)(shift_validation_1.approveRejectShiftSchema), shift_controller_1.shiftController.reviewRegistration);
exports.default = router;
//# sourceMappingURL=shift.routes.js.map