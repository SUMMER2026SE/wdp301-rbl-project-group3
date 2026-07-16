import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/response.util';
import {
  createEmployeeSchema,
  listEmployeesSchema,
  updateEmployeeSchema,
} from './employee.validation';
import { employeeService } from './employee.service';

function actorFrom(req: Request) {
  return { userId: req.user!.userId, role: req.user!.role };
}

export class EmployeeController {
  list = asyncHandler(async (req: Request, res: Response) => {
    const { query } = listEmployeesSchema.parse({ query: req.query });
    const result = await employeeService.listEmployees(query, actorFrom(req));
    sendSuccess(res, result, 'Employees retrieved');
  });

  getById = asyncHandler(async (req: Request, res: Response) => {
    const employee = await employeeService.getEmployee(
      String(req.params.id),
      actorFrom(req)
    );
    sendSuccess(res, { employee }, 'Employee retrieved');
  });

  create = asyncHandler(async (req: Request, res: Response) => {
    const { body } = createEmployeeSchema.parse({ body: req.body });
    const employee = await employeeService.createEmployee(body, actorFrom(req));
    sendSuccess(res, { employee }, 'Employee created', 201);
  });

  update = asyncHandler(async (req: Request, res: Response) => {
    const { params, body } = updateEmployeeSchema.parse({
      params: req.params,
      body: req.body,
    });
    const employee = await employeeService.updateEmployee(
      params.id,
      body,
      actorFrom(req)
    );
    sendSuccess(res, { employee }, 'Employee updated');
  });

  deactivate = asyncHandler(async (req: Request, res: Response) => {
    const employee = await employeeService.deactivateEmployee(
      String(req.params.id),
      actorFrom(req)
    );
    sendSuccess(res, { employee }, 'Employee deactivated');
  });
}

export const employeeController = new EmployeeController();
