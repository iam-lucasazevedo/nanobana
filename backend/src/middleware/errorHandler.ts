import { Request, Response, NextFunction } from 'express';
import { ErrorResponse } from '../types/models.js';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public details?: string
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export function errorHandler(
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  console.error('Error:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });

  if (err instanceof AppError) {
    const response: ErrorResponse = {
      error: err.message,
      details: process.env.NODE_ENV === 'development' ? err.details : undefined
    };
    res.status(err.statusCode).json(response);
    return;
  }

  // Handle generic errors
  const response: ErrorResponse = {
    error: 'Internal server error',
    details:
      process.env.NODE_ENV === 'development'
        ? err.message
        : 'An unexpected error occurred'
  };
  res.status(500).json(response);
}

/**
 * Middleware to catch async errors in route handlers
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
