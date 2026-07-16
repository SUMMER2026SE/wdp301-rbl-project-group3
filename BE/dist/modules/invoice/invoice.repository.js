"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.invoiceRepository = exports.InvoiceRepository = void 0;
const mongoose_1 = require("mongoose");
const invoice_model_1 = require("../../models/invoice.model");
const order_model_1 = require("../../models/order.model");
const user_model_1 = require("../../models/user.model");
class InvoiceRepository {
    async findOrderForInvoice(orderId) {
        return order_model_1.Order.findById(orderId)
            .populate('customerId', 'fullName email phone')
            .populate('branchId', 'name code address phone')
            .populate('items.productId', 'name sku unit')
            .exec();
    }
    async reserveOrderForInvoice(orderId, invoiceId) {
        const staleAt = new Date(Date.now() - 5 * 60 * 1000);
        return order_model_1.Order.findOneAndUpdate({
            _id: orderId,
            status: { $in: ['confirmed', 'preparing', 'delivering', 'delivered'] },
            invoiceIssuedAt: { $exists: false },
            $or: [
                { invoiceReservationAt: { $exists: false } },
                { invoiceReservationAt: { $lt: staleAt } },
            ],
        }, {
            $set: {
                invoiceId: new mongoose_1.Types.ObjectId(invoiceId),
                invoiceReservationAt: new Date(),
            },
        }, { new: true })
            .populate('customerId', 'fullName email phone')
            .populate('branchId', 'name code address phone')
            .populate('items.productId', 'name sku unit')
            .exec();
    }
    async releaseOrderInvoiceReservation(orderId, invoiceId) {
        await order_model_1.Order.updateOne({ _id: orderId, invoiceId: new mongoose_1.Types.ObjectId(invoiceId) }, {
            $unset: {
                invoiceId: 1,
                invoiceReservationAt: 1,
            },
        }).exec();
    }
    async releaseStaleOrderInvoiceReservation(orderId) {
        const staleAt = new Date(Date.now() - 5 * 60 * 1000);
        await order_model_1.Order.updateOne({
            _id: orderId,
            invoiceIssuedAt: { $exists: false },
            invoiceReservationAt: { $lt: staleAt },
        }, {
            $unset: {
                invoiceId: 1,
                invoiceReservationAt: 1,
            },
        }).exec();
    }
    async renewOrderInvoiceReservation(orderId, invoiceId) {
        const result = await order_model_1.Order.updateOne({
            _id: orderId,
            status: { $in: ['confirmed', 'preparing', 'delivering', 'delivered'] },
            invoiceId: new mongoose_1.Types.ObjectId(invoiceId),
            invoiceIssuedAt: { $exists: false },
        }, { $set: { invoiceReservationAt: new Date() } }).exec();
        return result.matchedCount === 1;
    }
    async repairOrderInvoiceReference(orderId, invoiceId, issuedAt) {
        await order_model_1.Order.updateOne({ _id: orderId }, {
            $set: {
                invoiceId: new mongoose_1.Types.ObjectId(invoiceId),
                invoiceIssuedAt: issuedAt,
            },
            $unset: { invoiceReservationAt: 1 },
        }).exec();
    }
    async finalizeOrderInvoice(orderId, invoiceId, issuedAt) {
        const result = await order_model_1.Order.updateOne({
            _id: orderId,
            status: { $in: ['confirmed', 'preparing', 'delivering', 'delivered'] },
            invoiceId: new mongoose_1.Types.ObjectId(invoiceId),
            invoiceIssuedAt: { $exists: false },
        }, {
            $set: { invoiceIssuedAt: issuedAt },
            $unset: { invoiceReservationAt: 1 },
        }).exec();
        return result.modifiedCount === 1 || result.matchedCount === 1;
    }
    async findById(id) {
        return invoice_model_1.Invoice.findById(id)
            .populate('issuedBy', 'fullName email')
            .exec();
    }
    async findByOrderId(orderId) {
        return invoice_model_1.Invoice.findOne({ orderId })
            .populate('issuedBy', 'fullName email')
            .exec();
    }
    async findIssuer(userId) {
        return user_model_1.User.findById(userId).select('fullName email status').exec();
    }
    async create(data) {
        return new invoice_model_1.Invoice(data).save();
    }
    async deleteById(id) {
        await invoice_model_1.Invoice.deleteOne({ _id: id }).exec();
    }
    async recordPrint(id) {
        return invoice_model_1.Invoice.findByIdAndUpdate(id, {
            $inc: { printCount: 1 },
            $set: { lastPrintedAt: new Date() },
        }, { new: true }).exec();
    }
}
exports.InvoiceRepository = InvoiceRepository;
exports.invoiceRepository = new InvoiceRepository();
//# sourceMappingURL=invoice.repository.js.map