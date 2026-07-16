"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.invoiceService = exports.InvoiceService = void 0;
const mongoose_1 = require("mongoose");
const errorHandler_middleware_1 = require("../../middlewares/errorHandler.middleware");
const backOfficeAccess_util_1 = require("../../utils/backOfficeAccess.util");
const pdf_util_1 = require("../../utils/pdf.util");
const invoice_repository_1 = require("./invoice.repository");
class InvoiceService {
    async issueInvoice(orderId, actor) {
        const existing = await invoice_repository_1.invoiceRepository.findByOrderId(orderId);
        if (existing) {
            await (0, backOfficeAccess_util_1.assertBackOfficeBranchAccess)(actor, existing.branchId.toString());
            await invoice_repository_1.invoiceRepository.repairOrderInvoiceReference(orderId, existing._id.toString(), existing.issuedAt);
            return existing;
        }
        const invoiceId = new mongoose_1.Types.ObjectId().toString();
        const order = await invoice_repository_1.invoiceRepository.reserveOrderForInvoice(orderId, invoiceId);
        if (!order) {
            const currentOrder = await invoice_repository_1.invoiceRepository.findOrderForInvoice(orderId);
            if (!currentOrder)
                throw new errorHandler_middleware_1.AppError('Order not found', 404);
            const racedInvoice = await invoice_repository_1.invoiceRepository.findByOrderId(orderId);
            if (racedInvoice) {
                await (0, backOfficeAccess_util_1.assertBackOfficeBranchAccess)(actor, racedInvoice.branchId.toString());
                await invoice_repository_1.invoiceRepository.repairOrderInvoiceReference(orderId, racedInvoice._id.toString(), racedInvoice.issuedAt);
                return racedInvoice;
            }
            throw new errorHandler_middleware_1.AppError('Order is cancelled, not ready for invoicing, or another invoice request is in progress', 409);
        }
        try {
            await (0, backOfficeAccess_util_1.assertBackOfficeBranchAccess)(actor, this.objectId(order.branchId));
        }
        catch (error) {
            await invoice_repository_1.invoiceRepository.releaseOrderInvoiceReservation(orderId, invoiceId);
            throw error;
        }
        const issuer = await invoice_repository_1.invoiceRepository.findIssuer(actor.userId);
        if (!issuer || issuer.status !== 'active') {
            await invoice_repository_1.invoiceRepository.releaseOrderInvoiceReservation(orderId, invoiceId);
            throw new errorHandler_middleware_1.AppError('Active invoice issuer account required', 403);
        }
        const branch = order.branchId;
        const customer = order.customerId;
        const listedAmount = order.items.reduce((sum, item) => sum + item.subtotal, 0);
        const data = {
            _id: new mongoose_1.Types.ObjectId(invoiceId),
            invoiceNumber: `INV-${order.code}`,
            orderId: order._id,
            orderCode: order.code,
            branchId: branch._id,
            branchName: branch.name,
            branchCode: branch.code,
            branchAddress: branch.address,
            branchPhone: branch.phone,
            customerId: customer._id,
            customerName: customer.fullName,
            customerEmail: customer.email,
            customerPhone: order.phoneNumber || customer.phone,
            deliveryAddress: order.deliveryAddress,
            items: order.items.map((item) => {
                const product = item.productId;
                return {
                    productId: product._id || item.productId,
                    productName: product.name || 'Unknown product',
                    sku: product.sku,
                    unit: product.unit,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                    subtotal: item.subtotal,
                };
            }),
            listedAmount,
            discountAmount: Math.max(0, listedAmount - order.totalAmount),
            totalAmount: order.totalAmount,
            issuedBy: new mongoose_1.Types.ObjectId(actor.userId),
            issuedByName: issuer.fullName,
            issuedByEmail: issuer.email,
            issuedAt: new Date(),
        };
        const reservationOwned = await invoice_repository_1.invoiceRepository.renewOrderInvoiceReservation(orderId, invoiceId);
        if (!reservationOwned) {
            throw new errorHandler_middleware_1.AppError('Invoice reservation expired or was replaced. Please retry.', 409);
        }
        let invoice;
        try {
            invoice = await invoice_repository_1.invoiceRepository.create(data);
        }
        catch (error) {
            const mongoError = error;
            if (mongoError.code === 11000) {
                const racedInvoice = await invoice_repository_1.invoiceRepository.findByOrderId(orderId);
                if (racedInvoice) {
                    await invoice_repository_1.invoiceRepository.repairOrderInvoiceReference(orderId, racedInvoice._id.toString(), racedInvoice.issuedAt);
                    return racedInvoice;
                }
            }
            await invoice_repository_1.invoiceRepository.releaseOrderInvoiceReservation(orderId, invoiceId);
            throw error;
        }
        try {
            const finalized = await invoice_repository_1.invoiceRepository.finalizeOrderInvoice(orderId, invoiceId, invoice.issuedAt);
            if (!finalized) {
                await invoice_repository_1.invoiceRepository.deleteById(invoiceId);
                throw new errorHandler_middleware_1.AppError('Invoice reservation was lost before completion. Please retry.', 409);
            }
        }
        catch (error) {
            if (error instanceof errorHandler_middleware_1.AppError)
                throw error;
            console.error('[ORDER_INVOICE_FINALIZE_FAILED]', {
                orderId,
                invoiceId,
                error,
            });
        }
        return invoice;
    }
    async getById(id, actor) {
        const invoice = await invoice_repository_1.invoiceRepository.findById(id);
        if (!invoice)
            throw new errorHandler_middleware_1.AppError('Invoice not found', 404);
        await (0, backOfficeAccess_util_1.assertBackOfficeBranchAccess)(actor, invoice.branchId.toString());
        return invoice;
    }
    async getByOrderId(orderId, actor) {
        const invoice = await invoice_repository_1.invoiceRepository.findByOrderId(orderId);
        if (!invoice)
            throw new errorHandler_middleware_1.AppError('Invoice not found', 404);
        await (0, backOfficeAccess_util_1.assertBackOfficeBranchAccess)(actor, invoice.branchId.toString());
        return invoice;
    }
    async createPdf(id, actor) {
        const invoice = await this.getById(id, actor);
        const pdf = (0, pdf_util_1.createInvoicePdf)(invoice);
        await invoice_repository_1.invoiceRepository.recordPrint(id);
        return { invoice, pdf };
    }
    objectId(value) {
        if (value && typeof value === 'object' && '_id' in value) {
            return String(value._id);
        }
        return String(value);
    }
}
exports.InvoiceService = InvoiceService;
exports.invoiceService = new InvoiceService();
//# sourceMappingURL=invoice.service.js.map