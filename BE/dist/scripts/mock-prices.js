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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv = __importStar(require("dotenv"));
const path_1 = __importDefault(require("path"));
// Load env
dotenv.config({ path: path_1.default.join(__dirname, '../../.env') });
// Import Models
const product_model_1 = require("../models/product.model");
const inventory_model_1 = require("../models/inventory.model");
const category_model_1 = require("../models/category.model");
const importReceipt_model_1 = require("../models/importReceipt.model");
const order_model_1 = require("../models/order.model");
const invoice_model_1 = require("../models/invoice.model");
const run = async () => {
    try {
        console.log('Connecting to MongoDB...', process.env.MONGODB_URI);
        await mongoose_1.default.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/supermarket');
        console.log('Connected!');
        // 1. Process Products
        console.log('Processing Products...');
        const products = await product_model_1.Product.find({ $or: [{ costPrice: 0 }, { salePrice: 0 }, { costPrice: { $exists: false } }, { salePrice: { $exists: false } }] }).exec();
        console.log(`Found ${products.length} products with 0 or missing price.`);
        for (const prod of products) {
            let cost = prod.costPrice || 0;
            let sale = prod.salePrice || 0;
            if (cost === 0) {
                cost = Math.floor(Math.random() * 40 + 10) * 1000; // 10k to 50k
                prod.costPrice = cost;
            }
            if (sale === 0) {
                // Find category to get minMargin
                let minMargin = 10;
                if (prod.categoryId) {
                    const cat = await category_model_1.Category.findById(prod.categoryId).exec();
                    if (cat && cat.minMargin) {
                        minMargin = cat.minMargin;
                    }
                }
                const floorPrice = cost * (1 + minMargin / 100);
                // Sale price is floor price + 5-20% random buffer
                const buffer = 1 + (Math.floor(Math.random() * 15 + 5) / 100);
                sale = Math.ceil((floorPrice * buffer) / 1000) * 1000; // Round to thousands
                prod.salePrice = sale;
            }
            await prod.save();
        }
        console.log('Products updated.');
        // 2. Process Inventories
        console.log('Processing Inventories...');
        const inventories = await inventory_model_1.Inventory.find({ $or: [{ averageCost: 0 }, { averageCost: { $exists: false } }] }).exec();
        console.log(`Found ${inventories.length} inventories with 0 averageCost.`);
        for (const inv of inventories) {
            const prod = await product_model_1.Product.findById(inv.productId).exec();
            if (prod && prod.costPrice) {
                inv.averageCost = prod.costPrice;
                inv.lastImportCost = prod.costPrice;
                await inv.save();
            }
        }
        console.log('Inventories updated.');
        // 3. Process ImportReceipts
        console.log('Processing Import Receipts...');
        const receipts = await importReceipt_model_1.ImportReceipt.find({ 'items.unitCost': 0 }).exec();
        console.log(`Found ${receipts.length} receipts with 0 unitCost.`);
        for (const receipt of receipts) {
            let receiptTotal = 0;
            let changed = false;
            for (const item of receipt.items) {
                if (item.unitCost === 0) {
                    const prod = await product_model_1.Product.findById(item.productId).exec();
                    const cost = (prod && prod.costPrice) ? prod.costPrice : 15000;
                    item.unitCost = cost;
                    item.subtotal = cost * item.quantity;
                    item.appliedAverageCost = cost;
                    changed = true;
                }
                receiptTotal += item.subtotal;
            }
            if (changed) {
                receipt.totalCost = receiptTotal;
                await receipt.save();
            }
        }
        console.log('Import Receipts updated.');
        // 4. Process Orders (unitPrice)
        console.log('Processing Orders...');
        const orders = await order_model_1.Order.find({ 'items.unitPrice': 0 }).exec();
        console.log(`Found ${orders.length} orders with 0 unitPrice.`);
        for (const order of orders) {
            let subtotal = 0;
            let changed = false;
            for (const item of order.items) {
                if (item.unitPrice === 0) {
                    const prod = await product_model_1.Product.findById(item.productId).exec();
                    const price = (prod && prod.salePrice) ? prod.salePrice : 20000;
                    item.unitPrice = price;
                    item.subtotal = price * item.quantity;
                    changed = true;
                }
                subtotal += (item.unitPrice * item.quantity);
            }
            if (changed) {
                order.totalAmount = subtotal;
                await order.save();
            }
        }
        console.log('Orders updated.');
        // 5. Process Invoices (unitPrice)
        console.log('Processing Invoices...');
        const invoices = await invoice_model_1.Invoice.find({ 'items.unitPrice': 0 }).exec();
        console.log(`Found ${invoices.length} invoices with 0 unitPrice.`);
        for (const invoice of invoices) {
            let subtotal = 0;
            let changed = false;
            for (const item of invoice.items) {
                if (item.unitPrice === 0) {
                    const prod = await product_model_1.Product.findById(item.productId).exec();
                    const price = (prod && prod.salePrice) ? prod.salePrice : 20000;
                    item.unitPrice = price;
                    item.subtotal = price * item.quantity;
                    changed = true;
                }
                subtotal += (item.unitPrice * item.quantity);
            }
            if (changed) {
                invoice.listedAmount = subtotal;
                invoice.totalAmount = subtotal - (invoice.discountAmount || 0);
                await invoice.save();
            }
        }
        console.log('Invoices updated.');
        console.log('All done!');
        process.exit(0);
    }
    catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
};
run();
//# sourceMappingURL=mock-prices.js.map