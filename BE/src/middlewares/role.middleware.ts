import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../types/common.types';
import { AppError } from './errorHandler.middleware';

/**
 * Builds a middleware guard that restricts an endpoint to the listed roles.
 * The implementation is shared to keep this cross-cutting behavior consistent.
 */
export const authorize = (...roles: UserRole[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError('Not authenticated', 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(new AppError('Insufficient permissions', 403));
    }

    next();
  };
};
/**
 * Express middleware that enforces a cross-cutting request-processing concern.
 * This file is intentionally kept focused so callers depend on one clear responsibility.
 */
