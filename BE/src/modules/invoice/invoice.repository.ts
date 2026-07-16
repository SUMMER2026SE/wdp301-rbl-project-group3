import { Types } from 'mongoose';
import { IInvoice, Invoice } from '../../models/invoice.model';
import { IOrder, Order } from '../../models/order.model';
import { IUser, User } from '../../models/user.model';

export class InvoiceRepository {
  async findOrderForInvoice(orderId: string): Promise<IOrder | null> {
    return Order.findById(orderId)
      .populate('customerId', 'fullName email phone')
      .populate('branchId', 'name code address phone')
      .populate('items.productId', 'name sku unit')
      .exec();
  }

  async reserveOrderForInvoice(
    orderId: string,
    invoiceId: string
  ): Promise<IOrder | null> {
    const staleAt = new Date(Date.now() - 5 * 60 * 1000);
    return Order.findOneAndUpdate(
      {
        _id: orderId,
        status: { $in: ['confirmed', 'preparing', 'delivering', 'delivered'] },
        invoiceIssuedAt: { $exists: false },
        $or: [
          { invoiceReservationAt: { $exists: false } },
          { invoiceReservationAt: { $lt: staleAt } },
        ],
      },
      {
        $set: {
          invoiceId: new Types.ObjectId(invoiceId),
          invoiceReservationAt: new Date(),
        },
      },
      { new: true }
    )
      .populate('customerId', 'fullName email phone')
      .populate('branchId', 'name code address phone')
      .populate('items.productId', 'name sku unit')
      .exec();
  }

  async releaseOrderInvoiceReservation(
    orderId: string,
    invoiceId: string
  ): Promise<void> {
    await Order.updateOne(
      { _id: orderId, invoiceId: new Types.ObjectId(invoiceId) },
      {
        $unset: {
          invoiceId: 1,
          invoiceReservationAt: 1,
        },
      }
    ).exec();
  }

  async releaseStaleOrderInvoiceReservation(orderId: string): Promise<void> {
    const staleAt = new Date(Date.now() - 5 * 60 * 1000);
    await Order.updateOne(
      {
        _id: orderId,
        invoiceIssuedAt: { $exists: false },
        invoiceReservationAt: { $lt: staleAt },
      },
      {
        $unset: {
          invoiceId: 1,
          invoiceReservationAt: 1,
        },
      }
    ).exec();
  }

  async renewOrderInvoiceReservation(
    orderId: string,
    invoiceId: string
  ): Promise<boolean> {
    const result = await Order.updateOne(
      {
        _id: orderId,
        status: { $in: ['confirmed', 'preparing', 'delivering', 'delivered'] },
        invoiceId: new Types.ObjectId(invoiceId),
        invoiceIssuedAt: { $exists: false },
      },
      { $set: { invoiceReservationAt: new Date() } }
    ).exec();
    return result.matchedCount === 1;
  }

  async repairOrderInvoiceReference(
    orderId: string,
    invoiceId: string,
    issuedAt: Date
  ): Promise<void> {
    await Order.updateOne(
      { _id: orderId },
      {
        $set: {
          invoiceId: new Types.ObjectId(invoiceId),
          invoiceIssuedAt: issuedAt,
        },
        $unset: { invoiceReservationAt: 1 },
      }
    ).exec();
  }

  async finalizeOrderInvoice(
    orderId: string,
    invoiceId: string,
    issuedAt: Date
  ): Promise<boolean> {
    const result = await Order.updateOne(
      {
        _id: orderId,
        status: { $in: ['confirmed', 'preparing', 'delivering', 'delivered'] },
        invoiceId: new Types.ObjectId(invoiceId),
        invoiceIssuedAt: { $exists: false },
      },
      {
        $set: { invoiceIssuedAt: issuedAt },
        $unset: { invoiceReservationAt: 1 },
      }
    ).exec();
    return result.modifiedCount === 1 || result.matchedCount === 1;
  }

  async findById(id: string): Promise<IInvoice | null> {
    return Invoice.findById(id)
      .populate('issuedBy', 'fullName email')
      .exec();
  }

  async findByOrderId(orderId: string): Promise<IInvoice | null> {
    return Invoice.findOne({ orderId })
      .populate('issuedBy', 'fullName email')
      .exec();
  }

  async findIssuer(userId: string): Promise<IUser | null> {
    return User.findById(userId).select('fullName email status').exec();
  }

  async create(data: Partial<IInvoice>): Promise<IInvoice> {
    return new Invoice(data).save();
  }

  async deleteById(id: string): Promise<void> {
    await Invoice.deleteOne({ _id: id }).exec();
  }

  async recordPrint(id: string): Promise<IInvoice | null> {
    return Invoice.findByIdAndUpdate(
      id,
      {
        $inc: { printCount: 1 },
        $set: { lastPrintedAt: new Date() },
      },
      { new: true }
    ).exec();
  }
}

export const invoiceRepository = new InvoiceRepository();
