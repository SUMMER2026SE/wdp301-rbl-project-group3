import jwt from 'jsonwebtoken';
import { env } from '../config/env.config';
import { JwtAccessPayload, JwtRefreshPayload, UserRole } from '../types/common.types';

export const generateAccessToken = (payload: JwtAccessPayload): string => {
  return jwt.sign(payload, env.jwt.accessSecret, {
    expiresIn: env.jwt.accessExpiresIn as jwt.SignOptions['expiresIn'],
  });
};

export const generateRefreshToken = (payload: JwtRefreshPayload): string => {
  return jwt.sign(payload, env.jwt.refreshSecret, {
    expiresIn: env.jwt.refreshExpiresIn as jwt.SignOptions['expiresIn'],
  });
};

export const verifyAccessToken = (token: string): JwtAccessPayload => {
  return jwt.verify(token, env.jwt.accessSecret) as JwtAccessPayload;
};

export const verifyRefreshToken = (token: string): JwtRefreshPayload => {
  return jwt.verify(token, env.jwt.refreshSecret) as JwtRefreshPayload;
};

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
  });

  return { accessToken, refreshToken };
};