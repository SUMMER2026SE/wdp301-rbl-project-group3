"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const role_middleware_1 = require("../../middlewares/role.middleware");
const employee_controller_1 = require("./employee.controller");
const employee_validation_1 = require("./employee.validation");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate);
router.use((0, role_middleware_1.authorize)('admin', 'branch_manager'));
router.get('/', (0, employee_validation_1.validate)(employee_validation_1.listEmployeesSchema), employee_controller_1.employeeController.list);
router.post('/', (0, employee_validation_1.validate)(employee_validation_1.createEmployeeSchema), employee_controller_1.employeeController.create);
router.get('/:id', (0, employee_validation_1.validate)(employee_validation_1.employeeIdParamSchema), employee_controller_1.employeeController.getById);
router.patch('/:id', (0, employee_validation_1.validate)(employee_validation_1.updateEmployeeSchema), employee_controller_1.employeeController.update);
router.delete('/:id', (0, employee_validation_1.validate)(employee_validation_1.employeeIdParamSchema), employee_controller_1.employeeController.deactivate);
exports.default = router;
//# sourceMappingURL=employee.routes.js.map