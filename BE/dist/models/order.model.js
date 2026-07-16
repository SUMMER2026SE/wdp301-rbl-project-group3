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
exports.Order = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const OrderItemSchema = new mongoose_1.Schema({
    productId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    subtotal: { type: Number, required: true, min: 0 },
}, { _id: false });
const OrderSchema = new mongoose_1.Schema({
    code: { type: String, required: true, unique: true, trim: true },
    customerId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    branchId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Branch', required: true },
    items: { type: [OrderItemSchema], required: true },
    totalAmount: { type: Number, required: true, min: 0 },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'preparing', 'delivering', 'delivered', 'cancelled'],
        default: 'pending',
    },
    deliveryAddress: { type: String, trim: true },
    phoneNumber: { type: String, trim: true },
    paymentMethod: {
        type: String,
        enum: ['COD', 'banking', 'momo', 'vnpay'],
        default: 'COD',
    },
    note: { type: String, trim: true },
    confirmedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    confirmedAt: { type: Date },
    invoiceId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Invoice' },
    invoiceReservationAt: { type: Date },
    invoiceIssuedAt: { type: Date },
    returnMutationLockedAt: { type: Date },
    returnMutationLockId: { type: String },
}, {
    timestamps: true,
    versionKey: false,
});
OrderSchema.index({ code: 1 });
OrderSchema.index({ customerId: 1, createdAt: -1 });
OrderSchema.index({ branchId: 1, status: 1 });
exports.Order = mongoose_1.default.model('Order', OrderSchema);
//# sourceMappingURL=order.model.js.map