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
exports.Inventory = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const InventorySchema = new mongoose_1.Schema({
    branchId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Branch', required: true },
    productId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true, min: 0, default: 0 },
    averageCost: { type: Number, required: true, min: 0, default: 0 },
    lastImportCost: { type: Number, min: 0 },
    lowStockThreshold: { type: Number, required: true, min: 0, default: 10 },
    updatedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    appliedReturnIds: {
        type: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'ReturnRequest' }],
        default: [],
        select: false,
    },
    deductedOrderIds: {
        type: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'Order' }],
        default: [],
        select: false,
    },
    restoredOrderIds: {
        type: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'Order' }],
        default: [],
        select: false,
    },
}, {
    timestamps: true,
    versionKey: false,
});
InventorySchema.index({ branchId: 1, productId: 1 }, { unique: true });
InventorySchema.index({ branchId: 1 });
InventorySchema.index({ productId: 1 });
exports.Inventory = mongoose_1.default.model('Inventory', InventorySchema);
//# sourceMappingURL=inventory.model.js.map