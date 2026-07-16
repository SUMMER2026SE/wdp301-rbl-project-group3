import { Types } from 'mongoose';
import { AppError } from '../../middlewares/errorHandler.middleware';
import { IInvoice } from '../../models/invoice.model';
import { BackOfficeActor, assertBackOfficeBranchAccess } from '../../utils/backOfficeAccess.util';
import { createInvoicePdf } from '../../utils/pdf.util';
import { invoiceRepository } from './invoice.repository';

export class InvoiceService {
  async issueInvoice(orderId: string, actor: BackOfficeActor): Promise<IInvoice> {
    const existing = await invoiceRepository.findByOrderId(orderId);
    if (existing) {
      await assertBackOfficeBranchAccess(actor, existing.branchId.toString());
      await invoiceRepository.repairOrderInvoiceReference(
        orderId,
        existing._id.toString(),
        existing.issuedAt
      );
      return existing;
    }

    const invoiceId = new Types.ObjectId().toString();
    const order = await invoiceRepository.reserveOrderForInvoice(
      orderId,
      invoiceId
    );
    if (!order) {
      const currentOrder = await invoiceRepository.findOrderForInvoice(orderId);
      if (!currentOrder) throw new AppError('Order not found', 404);
      const racedInvoice = await invoiceRepository.findByOrderId(orderId);
      if (racedInvoice) {
        await assertBackOfficeBranchAccess(actor, racedInvoice.branchId.toString());
        await invoiceRepository.repairOrderInvoiceReference(
          orderId,
          racedInvoice._id.toString(),
          racedInvoice.issuedAt
        );
        return racedInvoice;
      }
      throw new AppError(
        'Order is cancelled, not ready for invoicing, or another invoice request is in progress',
        409
      );
    }
    try {
      await assertBackOfficeBranchAccess(actor, this.objectId(order.branchId));
    } catch (error) {
      await invoiceRepository.releaseOrderInvoiceReservation(orderId, invoiceId);
      throw error;
    }

    const issuer = await invoiceRepository.findIssuer(actor.userId);
    if (!issuer || issuer.status !== 'active') {
      await invoiceRepository.releaseOrderInvoiceReservation(orderId, invoiceId);
      throw new AppError('Active invoice issuer account required', 403);
    }

    const branch = order.branchId as unknown as {
      _id: Types.ObjectId;
      name: string;
      code: string;
      address: string;
      phone?: string;
    };
    const customer = order.customerId as unknown as {
      _id: Types.ObjectId;
      fullName: string;
      email?: string;
      phone?: string;
    };
    const listedAmount = order.items.reduce(
      (sum, item) => sum + item.subtotal,
      0
    );

    const data: Partial<IInvoice> = {
      _id: new Types.ObjectId(invoiceId),
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
        const product = item.productId as unknown as {
          _id: Types.ObjectId;
          name?: string;
          sku?: string;
          unit?: string;
        };
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
      issuedBy: new Types.ObjectId(actor.userId),
      issuedByName: issuer.fullName,
      issuedByEmail: issuer.email,
      issuedAt: new Date(),
    };

    const reservationOwned =
      await invoiceRepository.renewOrderInvoiceReservation(orderId, invoiceId);
    if (!reservationOwned) {
      throw new AppError(
        'Invoice reservation expired or was replaced. Please retry.',
        409
      );
    }

    let invoice: IInvoice;
    try {
      invoice = await invoiceRepository.create(data);
    } catch (error) {
      const mongoError = error as { code?: number };
      if (mongoError.code === 11000) {
        const racedInvoice = await invoiceRepository.findByOrderId(orderId);
        if (racedInvoice) {
          await invoiceRepository.repairOrderInvoiceReference(
            orderId,
            racedInvoice._id.toString(),
            racedInvoice.issuedAt
          );
          return racedInvoice;
        }
      }
      await invoiceRepository.releaseOrderInvoiceReservation(orderId, invoiceId);
      throw error;
    }

    try {
      const finalized = await invoiceRepository.finalizeOrderInvoice(
        orderId,
        invoiceId,
        invoice.issuedAt
      );
      if (!finalized) {
        await invoiceRepository.deleteById(invoiceId);
        throw new AppError(
          'Invoice reservation was lost before completion. Please retry.',
          409
        );
      }
    } catch (error) {
      if (error instanceof AppError) throw error;
      console.error('[ORDER_INVOICE_FINALIZE_FAILED]', {
        orderId,
        invoiceId,
        error,
      });
    }
    return invoice;
  }

  async getById(id: string, actor: BackOfficeActor): Promise<IInvoice> {
    const invoice = await invoiceRepository.findById(id);
    if (!invoice) throw new AppError('Invoice not found', 404);
    await assertBackOfficeBranchAccess(actor, invoice.branchId.toString());
    return invoice;
  }

  async getByOrderId(orderId: string, actor: BackOfficeActor): Promise<IInvoice> {
    const invoice = await invoiceRepository.findByOrderId(orderId);
    if (!invoice) throw new AppError('Invoice not found', 404);
    await assertBackOfficeBranchAccess(actor, invoice.branchId.toString());
    return invoice;
  }

  async createPdf(id: string, actor: BackOfficeActor) {
    const invoice = await this.getById(id, actor);
    const pdf = createInvoicePdf(invoice);
    await invoiceRepository.recordPrint(id);
    return { invoice, pdf };
  }

  private objectId(value: unknown): string {
    if (value && typeof value === 'object' && '_id' in value) {
      return String((value as { _id: Types.ObjectId })._id);
    }
    return String(value);
  }
}

export const invoiceService = new InvoiceService();
