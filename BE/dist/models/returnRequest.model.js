"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReturnRequest = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const ReturnItemSchema = new mongoose_1.Schema({
    productId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Product', required: true },
    productName: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    refundAmount: { type: Number, required: true, min: 0 },
    condition: {
        type: String,
        enum: ['resellable', 'damaged', 'expired'],
        required: true,
    },
}, { _id: false });
const ReturnRequestSchema = new mongoose_1.Schema({
    code: { type: String, required: true, unique: true, trim: true },
    orderId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Order', required: true },
    orderCode: { type: String, required: true, trim: true },
    customerId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    customerName: { type: String, required: true, trim: true },
    customerEmail: { type: String, trim: true },
    customerPhone: { type: String, trim: true },
    branchId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Branch', required: true },
    branchName: { type: String, required: true, trim: true },
    branchAddress: { type: String, required: true, trim: true },
    items: { type: [ReturnItemSchema], required: true },
    reason: { type: String, required: true, trim: true },
    totalRefund: { type: Number, required: true, min: 0 },
    status: {
        type: String,
        enum: ['pending', 'approved', 'completing', 'completed', 'rejected', 'cancelled'],
        default: 'pending',
    },
    createdBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    reviewedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: { type: Date },
    resolutionNote: { type: String, trim: true },
    completedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    completedAt: { type: Date },
    completionLockId: { type: String },
    completionLockedAt: { type: Date },
    refundStatus: {
        type: String,
        enum: ['pending', 'completed'],
        default: 'pending',
    },
    refundMethod: {
        type: String,
        enum: ['cash', 'bank_transfer', 'original_payment', 'other'],
    },
    refundReference: { type: String, trim: true },
    refundedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    refundedAt: { type: Date },
    cancelledBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    cancelledAt: { type: Date },
    cancellationReason: { type: String, trim: true },
}, { timestamps: true, versionKey: false });
ReturnRequestSchema.index({ orderId: 1, createdAt: -1 });
ReturnRequestSchema.index({ branchId: 1, status: 1, createdAt: -1 });
ReturnRequestSchema.index({ customerId: 1, createdAt: -1 });
exports.ReturnRequest = mongoose_1.default.model('ReturnRequest', ReturnRequestSchema);
//# sourceMappingURL=returnRequest.model.js.map