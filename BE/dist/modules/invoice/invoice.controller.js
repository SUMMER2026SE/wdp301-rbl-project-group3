"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.invoiceController = exports.InvoiceController = void 0;
const asyncHandler_1 = require("../../utils/asyncHandler");
const response_util_1 = require("../../utils/response.util");
const invoice_service_1 = require("./invoice.service");
function actorFrom(req) {
    return { userId: req.user.userId, role: req.user.role };
}
class InvoiceController {
    constructor() {
        this.issue = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const invoice = await invoice_service_1.invoiceService.issueInvoice(String(req.params.orderId), actorFrom(req));
            (0, response_util_1.sendSuccess)(res, { invoice }, 'Invoice issued', 201);
        });
        this.getByOrder = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const invoice = await invoice_service_1.invoiceService.getByOrderId(String(req.params.orderId), actorFrom(req));
            (0, response_util_1.sendSuccess)(res, { invoice }, 'Invoice retrieved');
        });
        this.getById = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const invoice = await invoice_service_1.invoiceService.getById(String(req.params.id), actorFrom(req));
            (0, response_util_1.sendSuccess)(res, { invoice }, 'Invoice retrieved');
        });
        this.downloadPdf = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { invoice, pdf } = await invoice_service_1.invoiceService.createPdf(String(req.params.id), actorFrom(req));
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="${invoice.invoiceNumber}.pdf"`);
            res.setHeader('Content-Length', pdf.length);
            res.status(200).send(pdf);
        });
    }
}
exports.InvoiceController = InvoiceController;
exports.invoiceController = new InvoiceController();
//# sourceMappingURL=invoice.controller.js.map