import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/token.util';
import { AppError } from './errorHandler.middleware';
import { User } from '../models/user.model';

/**
 * Authenticates a request from its access token and attaches the verified user context.
 * The implementation is shared to keep this cross-cutting behavior consistent.
 */
export const authenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let token: string | undefined;

    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }

    if (!token && req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      throw new AppError('Access token required', 401);
    }

    const payload = verifyAccessToken(token);
    const user = await User.findById(payload.userId)
      .select('email role status branchId refreshTokenVersion')
      .lean()
      .exec();

    if (!user) {
      throw new AppError('User account no longer exists', 401);
    }
    if (user.status !== 'active') {
      throw new AppError('Account is not active', 403);
    }
    if (
      (user.refreshTokenVersion ?? 0) !== payload.tokenVersion ||
      user.role !== payload.role
    ) {
      throw new AppError('Session is no longer valid. Please login again.', 401);
    }

    req.user = {
      userId: payload.userId,
      email: user.email,
      role: user.role,
      tokenVersion: payload.tokenVersion,
      branchId: user.branchId?.toString(),
    };

    next();
  } catch (error) {
    next(error);
  }
};
/**
 * Express middleware that enforces a cross-cutting request-processing concern.
 * This file is intentionally kept focused so callers depend on one clear responsibility.
 */
