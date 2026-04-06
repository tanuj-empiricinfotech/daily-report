import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { AuthService } from '../services/auth.service';
import { UnauthorizedError } from '../utils/errors';

export interface AuthRequest extends Request {
  user?: {
    userId: number;
    email: string;
    role: string;
    sessionId: number;
  };
}

const authService = new AuthService();

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Try cookie first, then Authorization header, then query param (fallback for iOS Safari)
    let token = req.cookies?.token;

    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.slice(7);
      }
    }

    // Query param fallback for SSE connections (EventSource can't set headers)
    if (!token && req.query.token) {
      token = req.query.token as string;
    }

    if (!token) {
      throw new UnauthorizedError('No token provided');
    }

    const decoded = verifyToken(token);

    // Verify session still exists in DB (enables immediate revocation)
    const sessionValid = await authService.isSessionValid(decoded.sessionId);
    if (!sessionValid) {
      throw new UnauthorizedError('Session has been revoked');
    }

    req.user = decoded;
    next();
  } catch (error) {
    next(new UnauthorizedError('Invalid or expired token'));
  }
};

export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (!req.user || req.user.role !== 'admin') {
    next(new UnauthorizedError('Admin access required'));
    return;
  }
  next();
};

/**
 * Helper function to get authenticated user from request
 * Throws UnauthorizedError if user is not authenticated
 */
export function getAuthenticatedUser(req: AuthRequest): { userId: number; email: string; role: string; sessionId: number } {
  if (!req.user) {
    throw new UnauthorizedError('User not authenticated');
  }
  return req.user;
}
