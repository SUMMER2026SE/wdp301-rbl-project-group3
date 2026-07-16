import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/response.util';
import { invoiceService } from './invoice.service';

function actorFrom(req: Request) {
  return { userId: req.user!.userId, role: req.user!.role };
}

export class InvoiceController {
  issue = asyncHandler(async (req: Request, res: Response) => {
    const invoice = await invoiceService.issueInvoice(
      String(req.params.orderId),
      actorFrom(req)
    );
    sendSuccess(res, { invoice }, 'Invoice issued', 201);
  });

  getByOrder = asyncHandler(async (req: Request, res: Response) => {
    const invoice = await invoiceService.getByOrderId(
      String(req.params.orderId),
      actorFrom(req)
    );
    sendSuccess(res, { invoice }, 'Invoice retrieved');
  });

  getById = asyncHandler(async (req: Request, res: Response) => {
    const invoice = await invoiceService.getById(
      String(req.params.id),
      actorFrom(req)
    );
    sendSuccess(res, { invoice }, 'Invoice retrieved');
  });

  downloadPdf = asyncHandler(async (req: Request, res: Response) => {
    const { invoice, pdf } = await invoiceService.createPdf(
      String(req.params.id),
      actorFrom(req)
    );
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${invoice.invoiceNumber}.pdf"`
    );
    res.setHeader('Content-Length', pdf.length);
    res.status(200).send(pdf);
  });
}

export const invoiceController = new InvoiceController();
