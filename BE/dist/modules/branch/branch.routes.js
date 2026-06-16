"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const branch_controller_1 = require("./branch.controller");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const role_middleware_1 = require("../../middlewares/role.middleware");
const branch_validation_1 = require("./branch.validation");
const router = (0, express_1.Router)();
const backOfficeRoles = ['superadmin', 'admin', 'manager', 'staff'];
router.use(auth_middleware_1.authenticate);
router.use((0, role_middleware_1.authorize)(...backOfficeRoles));
router.get('/', (0, branch_validation_1.validate)(branch_validation_1.listBranchesSchema), branch_controller_1.branchController.getAll);
router.get('/:id', (0, branch_validation_1.validate)(branch_validation_1.branchIdParamSchema), branch_controller_1.branchController.getById);
router.post('/', (0, branch_validation_1.validate)(branch_validation_1.createBranchSchema), branch_controller_1.branchController.create);
router.patch('/:id', (0, branch_validation_1.validate)(branch_validation_1.updateBranchSchema), branch_controller_1.branchController.update);
router.delete('/:id', (0, branch_validation_1.validate)(branch_validation_1.branchIdParamSchema), branch_controller_1.branchController.deactivate);
exports.default = router;
//# sourceMappingURL=branch.routes.js.map