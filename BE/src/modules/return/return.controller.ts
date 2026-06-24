import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/response.util';
import {
  cancelReturnSchema,
  completeReturnSchema,
  createReturnSchema,
  listReturnsSchema,
  rejectReturnSchema,
  resolveReturnSchema,
  updateReturnSchema,
} from './return.validation';
import { returnService } from './return.service';

function actorFrom(req: Request) {
  return { userId: req.user!.userId, role: req.user!.role };
}

export class ReturnController {
  list = asyncHandler(async (req: Request, res: Response) => {
    const { query } = listReturnsSchema.parse({ query: req.query });
    const result = await returnService.listReturns(query, actorFrom(req));
    sendSuccess(res, result, 'Return requests retrieved');
  });

  getById = asyncHandler(async (req: Request, res: Response) => {
    const request = await returnService.getReturn(
      String(req.params.id),
      actorFrom(req)
    );
    sendSuccess(res, { returnRequest: request }, 'Return request retrieved');
  });

  create = asyncHandler(async (req: Request, res: Response) => {
    const { body } = createReturnSchema.parse({ body: req.body });
    const request = await returnService.createReturn(body, actorFrom(req));
    sendSuccess(res, { returnRequest: request }, 'Return request created', 201);
  });

  update = asyncHandler(async (req: Request, res: Response) => {
    const { params, body } = updateReturnSchema.parse({
      params: req.params,
      body: req.body,
    });
    const request = await returnService.updateReturn(
      params.id,
      body,
      actorFrom(req)
    );
    sendSuccess(res, { returnRequest: request }, 'Return request updated');
  });

  cancel = asyncHandler(async (req: Request, res: Response) => {
    const { params, body } = cancelReturnSchema.parse({
      params: req.params,
      body: req.body,
    });
    const request = await returnService.cancelReturn(
      params.id,
      body.reason,
      actorFrom(req)
    );
    sendSuccess(res, { returnRequest: request }, 'Return request cancelled');
  });

  approve = asyncHandler(async (req: Request, res: Response) => {
    const { params, body } = resolveReturnSchema.parse({
      params: req.params,
      body: req.body,
    });
    const request = await returnService.approveReturn(
      params.id,
      body.note,
      actorFrom(req)
    );
    sendSuccess(res, { returnRequest: request }, 'Return request approved');
  });

  reject = asyncHandler(async (req: Request, res: Response) => {
    const { params, body } = rejectReturnSchema.parse({
      params: req.params,
      body: req.body,
    });
    const request = await returnService.rejectReturn(
      params.id,
      body.note,
      actorFrom(req)
    );
    sendSuccess(res, { returnRequest: request }, 'Return request rejected');
  });

  complete = asyncHandler(async (req: Request, res: Response) => {
    const { params, body } = completeReturnSchema.parse({
      params: req.params,
      body: req.body,
    });
    const request = await returnService.completeReturn(
      params.id,
      body,
      actorFrom(req)
    );
    sendSuccess(res, { returnRequest: request }, 'Return request completed');
  });
}

export const returnController = new ReturnController();
