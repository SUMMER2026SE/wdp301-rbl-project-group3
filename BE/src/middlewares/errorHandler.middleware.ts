import { Request, Response, NextFunction } from 'express';
import { ZodError, ZodIssue } from 'zod';
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  console.error('[ERROR]', err);

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
    return;
  }

  // Fix 1 & 2: cast err sang ZodError rõ ràng, type ZodIssue cho callback
  if (err instanceof ZodError) {
    const zodErr = err as ZodError;
    res.status(422).json({
      success: false,
      message: 'Validation failed',
      errors: zodErr.issues.map((issue: ZodIssue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      })),
    });
    return;
  }

  if (err instanceof TokenExpiredError) {
    res.status(401).json({
      success: false,
      message: 'Token expired',
    });
    return;
  }

  if (err instanceof JsonWebTokenError) {
    res.status(401).json({
      success: false,
      message: 'Invalid token',
    });
    return;
  }

  // Fix 3: dùng type guard kiểm tra code trước khi so sánh
  const mongoError = err as NodeJS.ErrnoException & { code?: number | string };
  if (mongoError.code !== undefined && String(mongoError.code) === '11000') {
    res.status(409).json({
      success: false,
      message: 'Resource already exists',
    });
    return;
  }

  res.status(500).json({
    success: false,
    message: 'Internal server error',
  });
};