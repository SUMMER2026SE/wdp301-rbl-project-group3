import mongoose from 'mongoose';
import { env } from '../config/env.config';
import { Product } from '../models/product.model';

const run = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(env.mongodbUri);
    console.log('Connected to MongoDB');

    // Crawled products have numeric SKUs (e.g., 10141374)
    const result = await Product.deleteMany({
      sku: /^\d+$/
    });
    console.log(`Successfully deleted ${result.deletedCount} crawled products from Product collection.`);
  } catch (error) {
    console.error('Error during cleanup:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

run();
/**
 * Supports backend composition, shared contracts, scheduled work, or operational data maintenance.
 * This file is intentionally kept focused so callers depend on one clear responsibility.
 */
