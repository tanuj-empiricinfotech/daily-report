import { Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { AuthRequest } from '../middleware/auth';
import { CreateUserDto } from '../types';

// Constants for cookie configuration (following clean code guidelines)
const COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

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
  const isProduction = process.env.NODE_ENV === 'production';
  const isBackendHttps = req.protocol === 'https' || req.secure || process.env.BACKEND_HTTPS === 'true';

  // For HTTPS backend with HTTPS frontend (or production), use secure cookies with sameSite: 'none'
  // This is required for cross-origin requests from Vercel frontend to Render backend
  if (isBackendHttps && (isHttpsOrigin || isProduction)) {
    return {
      httpOnly: true,
      secure: true, // FIXED: Must be true for HTTPS
      sameSite: 'none',
      maxAge: COOKIE_MAX_AGE_MS,
    };
  }

  // For HTTP backend (localhost development), use secure: false with sameSite: 'lax'
  // This provides CSRF protection while allowing cookies in local development
  return {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    maxAge: COOKIE_MAX_AGE_MS,
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
}

