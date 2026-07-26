import jwt from 'jsonwebtoken';
import { env } from '../config/env.config';
import { JwtAccessPayload, JwtRefreshPayload, UserRole } from '../types/common.types';

/**
 * Signs the short-lived JWT used to authorize API requests.
 * The implementation is shared to keep this cross-cutting behavior consistent.
 */
export const generateAccessToken = (payload: JwtAccessPayload): string => {
  return jwt.sign(payload, env.jwt.accessSecret, {
    expiresIn: env.jwt.accessExpiresIn as jwt.SignOptions['expiresIn'],
  });
};

/**
 * Signs the refresh JWT used to renew an authenticated session.
 * The implementation is shared to keep this cross-cutting behavior consistent.
 */
export const generateRefreshToken = (payload: JwtRefreshPayload): string => {
  return jwt.sign(payload, env.jwt.refreshSecret, {
    expiresIn: env.jwt.refreshExpiresIn as jwt.SignOptions['expiresIn'],
  });
};

/**
 * Verifies and decodes an access token according to the configured secret.
 * The implementation is shared to keep this cross-cutting behavior consistent.
 */
export const verifyAccessToken = (token: string): JwtAccessPayload => {
  return jwt.verify(token, env.jwt.accessSecret) as JwtAccessPayload;
};

/**
 * Verifies and decodes a refresh token according to the configured secret.
 * The implementation is shared to keep this cross-cutting behavior consistent.
 */
export const verifyRefreshToken = (token: string): JwtRefreshPayload => {
  return jwt.verify(token, env.jwt.refreshSecret) as JwtRefreshPayload;
};

/**
 * Creates linked access and refresh tokens for an authenticated user session.
 * The implementation is shared to keep this cross-cutting behavior consistent.
 */
export const generateTokenPair = (user: {
  _id: { toString(): string };
  email: string;
  role: UserRole;
  refreshTokenVersion: number;
}, tokenId: string): { accessToken: string; refreshToken: string } => {
  const accessToken = generateAccessToken({
    userId: user._id.toString(),
    email: user.email,
    role: user.role,
    tokenVersion: user.refreshTokenVersion,
  });

  const refreshToken = generateRefreshToken({
    userId: user._id.toString(),
    tokenId,
    tokenVersion: user.refreshTokenVersion,
  });

  return { accessToken, refreshToken };
};
/**
 * Shared backend utility that keeps this concern consistent across feature modules.
 * This file is intentionally kept focused so callers depend on one clear responsibility.
 */
