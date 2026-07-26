import { v2 as cloudinary } from 'cloudinary';
import { env } from './env.config';

cloudinary.config({
  cloud_name: env.cloudinary.cloudName,
  api_key: env.cloudinary.apiKey,
  api_secret: env.cloudinary.apiSecret,
});

export { cloudinary };
/**
 * Centralizes configuration and initialization for this external infrastructure integration.
 * This file is intentionally kept focused so callers depend on one clear responsibility.
 */
