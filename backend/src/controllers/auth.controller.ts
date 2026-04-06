import { Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { AuthRequest } from '../middleware/auth';
import { CreateUserDto } from '../types';
import { COOKIE_CONFIG } from '../config/app.config';
import { verifyToken } from '../utils/jwt';
import logger from '../utils/logger';
import { envConfig } from '../config/env.config';
import { BadRequestError, NotFoundError, UnauthorizedError } from '../utils/errors';

interface CookieOptions {
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'none' | 'lax' | 'strict';
  maxAge: number;
}

const getCookieOptions = (req: AuthRequest): CookieOptions => {
  const origin = req.headers.origin;
  const isHttpsOrigin = origin?.startsWith('https://');
  const isProduction = envConfig.nodeEnv === 'production';

  const forwardedProto = req.headers['x-forwarded-proto'] as string;
  const isBackendHttps =
    req.protocol === 'https' ||
    req.secure ||
    forwardedProto === 'https' ||
    envConfig.backendHttps;

  const useSecureCookies = (isBackendHttps && (isHttpsOrigin || isProduction)) || isHttpsOrigin;

  logger.debug('Cookie configuration', {
    origin,
    isHttpsOrigin,
    isProduction,
    protocol: req.protocol,
    secure: req.secure,
    forwardedProto,
    isBackendHttps,
    useSecureCookies,
  });

  if (useSecureCookies) {
    logger.debug('Using secure cookies (HTTPS)');
    return {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: COOKIE_CONFIG.MAX_AGE_MS,
    };
  }

  logger.debug('Using non-secure cookies (HTTP)');
  return {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    maxAge: COOKIE_CONFIG.MAX_AGE_MS,
  };
};

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  register = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data: CreateUserDto = req.body;
      const deviceInfo = req.headers['user-agent'] || undefined;
      const result = await this.authService.register(data, deviceInfo);

      const cookieOptions = getCookieOptions(req);
      res.cookie('token', result.token, cookieOptions);

      res.status(201).json({
        success: true,
        data: result.user,
        token: result.token,
      });
    } catch (error) {
      next(error);
    }
  };

  login = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, password } = req.body;
      const deviceInfo = req.headers['user-agent'] || undefined;
      const result = await this.authService.login(email, password, deviceInfo);

      const cookieOptions = getCookieOptions(req);
      res.cookie('token', result.token, cookieOptions);

      res.json({
        success: true,
        data: result.user,
        token: result.token,
      });
    } catch (error) {
      next(error);
    }
  };

  logout = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Try to revoke the session — best effort (token may already be expired)
      const token = req.cookies?.token || req.headers.authorization?.slice(7);
      if (token) {
        try {
          const decoded = verifyToken(token);
          await this.authService.revokeSession(decoded.sessionId, decoded.userId);
        } catch {
          // Token invalid/expired — just clear the cookie
        }
      }

      const cookieOptions = getCookieOptions(req);
      res.clearCookie('token', {
        httpOnly: cookieOptions.httpOnly,
        secure: cookieOptions.secure,
        sameSite: cookieOptions.sameSite,
      });

      res.json({
        success: true,
        message: 'Logged out successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  getSessions = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) throw new UnauthorizedError('Not authenticated');

      const currentSessionId = req.user?.sessionId;
      const sessions = await this.authService.getUserSessions(userId, currentSessionId);

      res.json({ success: true, data: sessions });
    } catch (error) {
      next(error);
    }
  };

  revokeSession = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) throw new UnauthorizedError('Not authenticated');

      const sessionId = parseInt(req.params.sessionId, 10);
      if (isNaN(sessionId)) {
        throw new BadRequestError('Invalid session ID');
      }

      const revoked = await this.authService.revokeSession(sessionId, userId);
      if (!revoked) {
        throw new NotFoundError('Session not found');
      }

      res.json({ success: true, message: 'Session revoked' });
    } catch (error) {
      next(error);
    }
  };

  revokeOtherSessions = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) throw new UnauthorizedError('Not authenticated');

      const currentSessionId = req.user?.sessionId;
      if (!currentSessionId) throw new UnauthorizedError('No active session');

      const count = await this.authService.revokeOtherSessions(userId, currentSessionId);

      res.json({ success: true, message: `Revoked ${count} other session(s)` });
    } catch (error) {
      next(error);
    }
  };

  changePassword = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new Error('User ID not found in request');
      }

      const { currentPassword, newPassword } = req.body;
      await this.authService.changePassword(userId, currentPassword, newPassword);

      res.json({
        success: true,
        message: 'Password updated successfully',
      });
    } catch (error) {
      next(error);
    }
  };
}
