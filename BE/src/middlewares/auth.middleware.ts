import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/token.util';
import { AppError } from './errorHandler.middleware';
import { User } from '../models/user.model';

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
      .select('email role status refreshTokenVersion')
      .lean()
      .exec();

    if (!user) {
      throw new AppError('User account no longer exists', 401);
    }
    if (user.status !== 'active') {
      throw new AppError('Account is not active', 403);
    }
    if (
      user.refreshTokenVersion !== payload.tokenVersion ||
      user.role !== payload.role
    ) {
      throw new AppError('Session is no longer valid. Please login again.', 401);
    }

    req.user = {
      userId: payload.userId,
      email: user.email,
      role: user.role,
      tokenVersion: payload.tokenVersion,
    };

    next();
  } catch (error) {
    next(error);
  }
};
