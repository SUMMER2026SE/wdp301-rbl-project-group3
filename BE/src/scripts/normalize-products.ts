import mongoose from 'mongoose';
import { env } from '../config/env.config';
import { Product } from '../models/product.model';
import { normalizeString } from '../utils/string.util';

const run = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(env.mongodbUri);
    console.log('Connected to MongoDB');

    const products = await Product.find({});
    console.log(`Found ${products.length} products. Starting normalization...`);

    let updatedCount = 0;
    for (const product of products) {
      const normalizedName = normalizeString(product.name);
      const normalizedBrand = product.brand ? normalizeString(product.brand) : undefined;
      const normalizedUnit = normalizeString(product.unit || 'item');

      product.normalizedName = normalizedName;
      product.normalizedBrand = normalizedBrand;
      product.normalizedUnit = normalizedUnit;

      await product.save();
      updatedCount++;
    }

    console.log(`Successfully normalized ${updatedCount} products.`);
  } catch (error) {
    console.error('Error during normalization:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

run();
