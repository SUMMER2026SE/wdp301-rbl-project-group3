import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const SALT_ROUNDS = 12;

/**
 * Hashes a plaintext password using the configured bcrypt work factor.
 * The implementation is shared to keep this cross-cutting behavior consistent.
 */
export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, SALT_ROUNDS);
};

/**
 * Compares a supplied password against its stored bcrypt hash.
 * The implementation is shared to keep this cross-cutting behavior consistent.
 */
export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

/**
 * Generates cryptographically secure opaque tokens for one-time flows.
 * The implementation is shared to keep this cross-cutting behavior consistent.
 */
export const generateSecureToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Creates a stable SHA-256 token digest suitable for database storage.
 * The implementation is shared to keep this cross-cutting behavior consistent.
 */
export const hashToken = (token: string): string => {
  return crypto.createHash('sha256').update(token).digest('hex');
};
/**
 * Shared backend utility that keeps this concern consistent across feature modules.
 * This file is intentionally kept focused so callers depend on one clear responsibility.
 */
