import mongoose from 'mongoose';
import { env } from './env.config';

export const connectDatabase = async (): Promise<void> => {
  try {
    await mongoose.connect(env.mongodbUri);
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection failed:', error);
    process.exit(1);
  }
};