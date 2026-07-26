import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import path from 'path';

// Load env
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Import Models
import { Product } from '../models/product.model';
import { Inventory } from '../models/inventory.model';
import { Category } from '../models/category.model';
import { ImportReceipt } from '../models/importReceipt.model';
import { Order } from '../models/order.model';
import { Invoice } from '../models/invoice.model';

const run = async () => {
  try {
    console.log('Connecting to MongoDB...', process.env.MONGODB_URI);
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/supermarket');
    console.log('Connected!');

    // 1. Process Products
    console.log('Processing Products...');
    const products = await Product.find({ $or: [{ costPrice: 0 }, { salePrice: 0 }, { costPrice: { $exists: false } }, { salePrice: { $exists: false } }] }).exec();
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
          const cat = await Category.findById(prod.categoryId).exec();
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
    const inventories = await Inventory.find({ $or: [{ averageCost: 0 }, { averageCost: { $exists: false } }] }).exec();
    console.log(`Found ${inventories.length} inventories with 0 averageCost.`);
    
    for (const inv of inventories) {
      const prod = await Product.findById(inv.productId).exec();
      if (prod && prod.costPrice) {
        inv.averageCost = prod.costPrice;
        inv.lastImportCost = prod.costPrice;
        await inv.save();
      }
    }
    console.log('Inventories updated.');

    // 3. Process ImportReceipts
    console.log('Processing Import Receipts...');
    const receipts = await ImportReceipt.find({ 'items.unitCost': 0 }).exec();
    console.log(`Found ${receipts.length} receipts with 0 unitCost.`);

    for (const receipt of receipts) {
      let receiptTotal = 0;
      let changed = false;

      for (const item of receipt.items) {
        if (item.unitCost === 0) {
          const prod = await Product.findById(item.productId).exec();
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
    const orders = await Order.find({ 'items.unitPrice': 0 }).exec();
    console.log(`Found ${orders.length} orders with 0 unitPrice.`);

    for (const order of orders) {
      let subtotal = 0;
      let changed = false;

      for (const item of order.items) {
        if (item.unitPrice === 0) {
          const prod = await Product.findById(item.productId).exec();
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
    const invoices = await Invoice.find({ 'items.unitPrice': 0 }).exec();
    console.log(`Found ${invoices.length} invoices with 0 unitPrice.`);

    for (const invoice of invoices) {
      let subtotal = 0;
      let changed = false;

      for (const item of invoice.items) {
        if (item.unitPrice === 0) {
          const prod = await Product.findById(item.productId).exec();
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
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
};

run();
/**
 * Supports backend composition, shared contracts, scheduled work, or operational data maintenance.
 * This file is intentionally kept focused so callers depend on one clear responsibility.
 */
