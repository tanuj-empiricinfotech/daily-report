import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import logger from '../utils/logger';
import { envConfig } from '../config/env.config';

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (err instanceof AppError) {
    // Log operational errors at warn level (expected errors)
    logger.warn('Application error', {
      statusCode: err.statusCode,
      message: err.message,
      path: req.path,
      method: req.method,
    });

    res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
    return;
  }

  // Log unexpected errors at error level
  logger.error('Unexpected error', {
    error: err.message,
    stack: envConfig.nodeEnv === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method,
  });

  // In development, include error details for debugging
  // In production, only return generic error message
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    ...(envConfig.nodeEnv === 'development' && {
      error: err.message,
      stack: err.stack,
    }),
  });
};

