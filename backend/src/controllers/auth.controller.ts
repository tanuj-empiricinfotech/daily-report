import { Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { AuthRequest } from '../middleware/auth';
import { CreateUserDto } from '../types';
import { COOKIE_CONFIG } from '../config/app.config';
import logger from '../utils/logger';
import { envConfig } from '../config/env.config';

interface CookieOptions {
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'none' | 'lax' | 'strict';
  maxAge: number;
}

/**
 * Gets cookie options based on the request origin and backend protocol.
 * Handles both HTTP (localhost) and HTTPS (production, Vercel, tunnels) environments.
 *
 * For HTTPS environments (production, Vercel, ngrok HTTPS, Render):
 *   - secure: true (cookies only sent over HTTPS)
 *   - sameSite: 'none' (allows cross-origin cookies with credentials)
 *
 * For HTTP environments (localhost development):
 *   - secure: false (allows cookies over HTTP)
 *   - sameSite: 'lax' (CSRF protection for same-site requests)
 */
const getCookieOptions = (req: AuthRequest): CookieOptions => {
  const origin = req.headers.origin;
  const isHttpsOrigin = origin?.startsWith('https://');
  const isProduction = envConfig.nodeEnv === 'production';

  // Check if backend is HTTPS through multiple methods:
  // 1. req.protocol === 'https' (works when trust proxy is enabled)
  // 2. req.secure (Express convenience property)
  // 3. X-Forwarded-Proto header (fallback for some proxies)
  // 4. BACKEND_HTTPS env var (manual override)
  const forwardedProto = req.headers['x-forwarded-proto'] as string;
  const isBackendHttps =
    req.protocol === 'https' ||
    req.secure ||
    forwardedProto === 'https' ||
    envConfig.backendHttps;

  // Use HTTPS cookies if:
  // - Backend is HTTPS AND (origin is HTTPS OR in production mode)
  // - Or if origin is HTTPS (regardless of backend detection)
  const useSecureCookies = (isBackendHttps && (isHttpsOrigin || isProduction)) || isHttpsOrigin;

  // Debug logging (only in development)
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
    // For HTTPS environments, use secure cookies with sameSite: 'none'
    // This is required for cross-origin requests from Vercel frontend to Render backend
    logger.debug('Using secure cookies (HTTPS)');
    return {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: COOKIE_CONFIG.MAX_AGE_MS,
    };
  }

  // For HTTP backend (localhost development), use secure: false with sameSite: 'lax'
  // This provides CSRF protection while allowing cookies in local development
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
      const result = await this.authService.register(data);

      res.cookie('token', result.token, getCookieOptions(req));

      res.status(201).json({
        success: true,
        data: result.user,
      });
    } catch (error) {
      next(error);
    }
  };

  login = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, password } = req.body;
      const result = await this.authService.login(email, password);

      res.cookie('token', result.token, getCookieOptions(req));

      res.json({
        success: true,
        data: result.user,
      });
    } catch (error) {
      next(error);
    }
  };

  logout = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
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

