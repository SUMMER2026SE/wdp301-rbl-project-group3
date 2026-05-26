import mongoose from 'mongoose';
import dns from 'dns';
import { env } from './env.config';

// Apply DNS guard for Windows/local environments
try {
  const dnsServers = dns.getServers();
  if (!dnsServers || dnsServers.length === 0 || (dnsServers.length === 1 && dnsServers[0] === '127.0.0.1')) {
    dns.setServers(['8.8.8.8', '1.1.1.1']);
    console.log('DNS servers configured for database connection.');
  }
} catch (dnsErr) {
  console.warn('Failed to configure DNS servers:', dnsErr);
}

export const connectDatabase = async (): Promise<void> => {
  try {
    await mongoose.connect(env.mongodbUri);
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection failed:', error);
    process.exit(1);
  }
};