import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import logger from '../utils/logger';
import { envConfig } from '../config/env.config';
import { ErrorLogsRepository } from '../db/repositories/error-logs.repository';
import { AuthRequest } from './auth';

const errorLogsRepository = new ErrorLogsRepository();

const REDACTED = '[REDACTED]';
const SENSITIVE_FIELDS = new Set([
  'password',
  'currentpassword',
  'newpassword',
  'token',
  'refreshtoken',
  'refresh_token',
  'accesstoken',
  'access_token',
  'authorization',
  'cookie',
  'set-cookie',
]);

const MAX_BODY_BYTES = 10_000;

function redact(value: unknown): unknown {
  if (value === null || value === undefined) return value;
  if (Array.isArray(value)) return value.map(redact);
  if (typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      if (SENSITIVE_FIELDS.has(key.toLowerCase())) {
        out[key] = REDACTED;
      } else {
        out[key] = redact(val);
      }
    }
    return out;
  }
  return value;
}

function truncate(value: unknown): unknown {
  if (value === null || value === undefined) return value;
  const json = JSON.stringify(value);
  if (json.length <= MAX_BODY_BYTES) return value;
  return { _truncated: true, preview: json.slice(0, MAX_BODY_BYTES) };
}

function persistErrorLog(err: Error, req: Request): void {
  const authReq = req as AuthRequest;
  errorLogsRepository
    .create({
      statusCode: 500,
      errorName: err.name || null,
      errorMessage: err.message || 'Unknown error',
      errorStack: err.stack || null,
      method: req.method,
      path: req.originalUrl || req.path,
      queryParams: Object.keys(req.query || {}).length > 0 ? redact(req.query) : null,
      requestBody: req.body && Object.keys(req.body).length > 0 ? truncate(redact(req.body)) : null,
      requestHeaders: redact(req.headers),
      userId: authReq.user?.userId ?? null,
      userEmail: authReq.user?.email ?? null,
      ipAddress: req.ip || null,
      userAgent: req.headers['user-agent'] || null,
    })
    .catch((dbErr) => {
      // Never let logging failures cascade — just record to the standard logger.
      logger.error('Failed to persist error log to database', {
        dbError: dbErr instanceof Error ? dbErr.message : String(dbErr),
        originalError: err.message,
      });
    });
}

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

  // Persist to DB asynchronously — fire-and-forget so the response is never blocked.
  persistErrorLog(err, req);

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
