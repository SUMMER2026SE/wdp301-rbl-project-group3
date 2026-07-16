import { Request, Response } from 'express';
import { shiftService } from './shift.service';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/response.util';

export class ShiftController {
  // --- Shift Templates ---
  createTemplate = asyncHandler(async (req: Request, res: Response) => {
    const template = await shiftService.createTemplate(
      {
        userId: req.user!.userId,
        role: req.user!.role,
        branchId: req.user!.branchId,
      },
      req.body
    );
    sendSuccess(res, { template }, 'Shift template created successfully', 201);
  });

  getTemplates = asyncHandler(async (req: Request, res: Response) => {
    const templates = await shiftService.getTemplates(
      {
        userId: req.user!.userId,
        role: req.user!.role,
        branchId: req.user!.branchId,
      },
      req.query.branchId as string | undefined
    );
    sendSuccess(res, { templates }, 'Shift templates retrieved successfully');
  });

  updateTemplate = asyncHandler(async (req: Request, res: Response) => {
    const template = await shiftService.updateTemplate(
      {
        userId: req.user!.userId,
        role: req.user!.role,
        branchId: req.user!.branchId,
      },
      String(req.params.id),
      req.body
    );
    sendSuccess(res, { template }, 'Shift template updated successfully');
  });

  deleteTemplate = asyncHandler(async (req: Request, res: Response) => {
    await shiftService.deleteTemplate(
      {
        userId: req.user!.userId,
        role: req.user!.role,
        branchId: req.user!.branchId,
      },
      String(req.params.id)
    );
    sendSuccess(res, null, 'Shift template deleted successfully');
  });

  // --- Shift Registrations ---
  registerShift = asyncHandler(async (req: Request, res: Response) => {
    const registration = await shiftService.registerShift(
      {
        userId: req.user!.userId,
        role: req.user!.role,
        branchId: req.user!.branchId,
      },
      req.body
    );
    sendSuccess(res, { registration }, 'Shift registered successfully', 201);
  });

  getRegistrations = asyncHandler(async (req: Request, res: Response) => {
    const registrations = await shiftService.getRegistrations(
      {
        userId: req.user!.userId,
        role: req.user!.role,
        branchId: req.user!.branchId,
      },
      {
        branchId: req.query.branchId as string | undefined,
        userId: req.query.userId as string | undefined,
        startDate: req.query.startDate as string | undefined,
        endDate: req.query.endDate as string | undefined,
        status: req.query.status as string | undefined,
      }
    );
    sendSuccess(res, { registrations }, 'Shift registrations retrieved successfully');
  });

  cancelRegistration = asyncHandler(async (req: Request, res: Response) => {
    await shiftService.cancelRegistration(
      {
        userId: req.user!.userId,
        role: req.user!.role,
        branchId: req.user!.branchId,
      },
      String(req.params.id)
    );
    sendSuccess(res, null, 'Shift registration cancelled successfully');
  });

  reviewRegistration = asyncHandler(async (req: Request, res: Response) => {
    const registration = await shiftService.reviewRegistration(
      {
        userId: req.user!.userId,
        role: req.user!.role,
        branchId: req.user!.branchId,
      },
      String(req.params.id),
      req.body
    );
    const action = req.body.status === 'approved' ? 'approved' : 'rejected';
    sendSuccess(res, { registration }, `Shift registration ${action} successfully`);
  });
}

export const shiftController = new ShiftController();
