const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://admin:2005huuphuc@cluster0.xbuducm.mongodb.net/minimart_db';

async function seed() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to DB');
  
  const db = mongoose.connection.db;

  // 1. Categories - minMargin
  const categories = await db.collection('categories').find({}).toArray();
  for (const cat of categories) {
    if (!cat.minMargin) {
      const margin = [10, 15, 20, 25, 30][Math.floor(Math.random() * 5)];
      await db.collection('categories').updateOne({ _id: cat._id }, { $set: { minMargin: margin } });
    }
  }
  console.log('Categories updated');

  // 2. Products - costPrice, salePrice
  const products = await db.collection('products').find({}).toArray();
  const productPriceMap = {};
  for (const p of products) {
    let cp = p.costPrice || 0;
    let sp = p.salePrice || 0;
    if (cp === 0) {
      cp = Math.floor(Math.random() * 40 + 10) * 1000; // 10k to 50k
    }
    if (sp === 0 || sp <= cp) {
      sp = Math.floor(cp * 1.3); // 30% margin
    }
    productPriceMap[p._id.toString()] = { costPrice: cp, salePrice: sp };
    
    await db.collection('products').updateOne(
      { _id: p._id }, 
      { $set: { costPrice: cp, salePrice: sp } }
    );
  }
  console.log('Products updated');

  // 3. Inventory - averageCost, lastImportCost
  const inventories = await db.collection('inventories').find({}).toArray();
  for (const inv of inventories) {
    const pPrices = productPriceMap[inv.productId.toString()];
    if (pPrices) {
      await db.collection('inventories').updateOne(
        { _id: inv._id },
        { $set: { 
          averageCost: pPrices.costPrice, 
          lastImportCost: pPrices.costPrice 
        }}
      );
    }
  }
  console.log('Inventories updated');

  // 4. CompetitorProduct - price
  const competitors = await db.collection('competitorproducts').find({}).toArray();
  for (const comp of competitors) {
    if (!comp.price || comp.price === 0) {
      const p = Math.floor(Math.random() * 40 + 10) * 1000;
      await db.collection('competitorproducts').updateOne(
        { _id: comp._id },
        { $set: { price: p } }
      );
    }
  }
  console.log('CompetitorProducts updated');

  // 5. ImportReceipt - unitCost, totalCost
  const receipts = await db.collection('importreceipts').find({}).toArray();
  for (const rec of receipts) {
    let totalCost = 0;
    if (rec.details && Array.isArray(rec.details)) {
      for (const d of rec.details) {
        if (!d.unitCost || d.unitCost === 0) {
          const pPrices = productPriceMap[d.productId.toString()];
          d.unitCost = pPrices ? pPrices.costPrice : (Math.floor(Math.random() * 40 + 10) * 1000);
        }
        if (!d.appliedAverageCost) {
          d.appliedAverageCost = d.unitCost;
        }
        totalCost += (d.quantity * d.unitCost);
      }
      await db.collection('importreceipts').updateOne(
        { _id: rec._id },
        { $set: { details: rec.details, totalCost: totalCost } }
      );
    }
  }
  console.log('ImportReceipts updated');

  // 6. Orders - unitPrice
  const orders = await db.collection('orders').find({}).toArray();
  for (const ord of orders) {
    let totalAmount = 0;
    if (ord.items && Array.isArray(ord.items)) {
      for (const item of ord.items) {
        if (!item.unitPrice || item.unitPrice === 0) {
          const pPrices = productPriceMap[item.productId.toString()];
          item.unitPrice = pPrices ? pPrices.salePrice : (Math.floor(Math.random() * 40 + 20) * 1000);
        }
        totalAmount += (item.quantity * item.unitPrice);
      }
      const finalAmount = totalAmount - (ord.discount || 0);
      await db.collection('orders').updateOne(
        { _id: ord._id },
        { $set: { items: ord.items, totalAmount: totalAmount, finalAmount: finalAmount } }
      );
    }
  }
  console.log('Orders updated');

  console.log('Seeding finished');
  process.exit(0);
}
seed().catch(console.error);
