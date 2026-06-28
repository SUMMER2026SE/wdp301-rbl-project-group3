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
exports.FlashSale = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const FlashSaleProductSchema = new mongoose_1.Schema({
    productId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Product', required: true },
    flashSalePrice: { type: Number, required: true, min: 0 },
    limitQuantity: { type: Number, required: true, min: 1 },
    soldQuantity: { type: Number, default: 0, min: 0 },
}, { _id: false });
const FlashSaleSchema = new mongoose_1.Schema({
    name: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, trim: true, maxlength: 1000 },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    scope: {
        type: String,
        enum: ['global', 'branch'],
        required: true,
    },
    branchId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Branch' },
    status: {
        type: String,
        enum: ['draft', 'active', 'inactive', 'expired'],
        default: 'draft',
    },
    products: { type: [FlashSaleProductSchema], required: true },
    createdBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
}, {
    timestamps: true,
    versionKey: false,
});
// Indexes for fast querying of active flash sales
FlashSaleSchema.index({ status: 1, startDate: 1, endDate: 1 });
FlashSaleSchema.index({ branchId: 1, status: 1 });
FlashSaleSchema.index({ scope: 1, status: 1 });
exports.FlashSale = mongoose_1.default.model('FlashSale', FlashSaleSchema);
//# sourceMappingURL=flash-sale.model.js.map