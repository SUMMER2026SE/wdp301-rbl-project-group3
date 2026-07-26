import { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * Converts rejected async route promises into Express error-handler flow.
 * The implementation is shared to keep this cross-cutting behavior consistent.
 */
export const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
/**
 * Shared backend utility that keeps this concern consistent across feature modules.
 * This file is intentionally kept focused so callers depend on one clear responsibility.
 */
