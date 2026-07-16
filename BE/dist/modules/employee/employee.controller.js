"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.employeeController = exports.EmployeeController = void 0;
const asyncHandler_1 = require("../../utils/asyncHandler");
const response_util_1 = require("../../utils/response.util");
const employee_validation_1 = require("./employee.validation");
const employee_service_1 = require("./employee.service");
function actorFrom(req) {
    return { userId: req.user.userId, role: req.user.role };
}
class EmployeeController {
    constructor() {
        this.list = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { query } = employee_validation_1.listEmployeesSchema.parse({ query: req.query });
            const result = await employee_service_1.employeeService.listEmployees(query, actorFrom(req));
            (0, response_util_1.sendSuccess)(res, result, 'Employees retrieved');
        });
        this.getById = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const employee = await employee_service_1.employeeService.getEmployee(String(req.params.id), actorFrom(req));
            (0, response_util_1.sendSuccess)(res, { employee }, 'Employee retrieved');
        });
        this.create = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { body } = employee_validation_1.createEmployeeSchema.parse({ body: req.body });
            const employee = await employee_service_1.employeeService.createEmployee(body, actorFrom(req));
            (0, response_util_1.sendSuccess)(res, { employee }, 'Employee created', 201);
        });
        this.update = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { params, body } = employee_validation_1.updateEmployeeSchema.parse({
                params: req.params,
                body: req.body,
            });
            const employee = await employee_service_1.employeeService.updateEmployee(params.id, body, actorFrom(req));
            (0, response_util_1.sendSuccess)(res, { employee }, 'Employee updated');
        });
        this.deactivate = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const employee = await employee_service_1.employeeService.deactivateEmployee(String(req.params.id), actorFrom(req));
            (0, response_util_1.sendSuccess)(res, { employee }, 'Employee deactivated');
        });
    }
}
exports.EmployeeController = EmployeeController;
exports.employeeController = new EmployeeController();
//# sourceMappingURL=employee.controller.js.map