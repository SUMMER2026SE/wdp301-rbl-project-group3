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
exports.Voucher = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const VoucherSchema = new mongoose_1.Schema({
    code: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        trim: true,
        maxlength: 50,
    },
    promotionId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Promotion', required: true },
    discountType: {
        type: String,
        enum: ['percentage', 'fixed_amount'],
        required: true,
    },
    discountValue: { type: Number, required: true, min: 0 },
    maxDiscountAmount: { type: Number, min: 0 },
    minOrderAmount: { type: Number, min: 0, default: 0 },
    pointCost: { type: Number, default: 0, min: 0 },
    targetMemberLevel: {
        type: String,
        enum: ['all', 'new', 'bronze', 'silver', 'gold', 'diamond'],
        default: 'all',
    },
    branchId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Branch' },
    expiresAt: { type: Date, required: true },
    status: {
        type: String,
        enum: ['active', 'used', 'expired', 'disabled'],
        default: 'active',
    },
    usedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    usedAt: { type: Date },
    orderId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Order' },
    claims: {
        type: [
            {
                userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
                status: { type: String, enum: ['active', 'used'], default: 'active' },
                claimedAt: { type: Date, default: Date.now },
                usedAt: { type: Date },
                orderId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Order' },
            },
        ],
        default: [],
    },
    createdBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
}, {
    timestamps: true,
    versionKey: false,
});
VoucherSchema.index({ code: 1 }, { unique: true });
VoucherSchema.index({ promotionId: 1, status: 1 });
VoucherSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
VoucherSchema.index({ branchId: 1, status: 1 });
VoucherSchema.index({ 'claims.userId': 1, 'claims.status': 1 });
exports.Voucher = mongoose_1.default.model('Voucher', VoucherSchema);
//# sourceMappingURL=voucher.model.js.map