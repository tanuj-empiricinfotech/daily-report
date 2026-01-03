import { Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { AuthRequest } from '../middleware/auth';
import { CreateUserDto } from '../types';

/**
 * Gets cookie options based on the request origin and backend protocol.
 * Handles both HTTP (localhost) and HTTPS (ngrok, pinggy) origins.
 * 
 * For HTTPS to HTTPS (cross-origin): secure: true, sameSite: 'none'
 * For HTTP to HTTP (localhost): secure: false, sameSite: 'lax'
 */
const getCookieOptions = (req: AuthRequest) => {
  const origin = req.headers.origin;
  const isHttpsOrigin = origin?.startsWith('https://');
  const isProduction = process.env.NODE_ENV === 'production';
  // Check if backend is HTTPS (works with trust proxy enabled)
  const isBackendHttps = req.protocol === 'https' || req.secure || process.env.BACKEND_HTTPS === 'true';

  // For HTTPS backend with HTTPS frontend (or production), use secure cookies with sameSite: 'none'
  if (isBackendHttps && (isHttpsOrigin || isProduction)) {
    return {
      httpOnly: true,
      secure: false,
      sameSite: 'none' as const,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    };
  }

  // For HTTP backend (localhost development), use secure: false with sameSite: 'lax'
  return {
    httpOnly: true,
    secure: false,
    sameSite: 'none' as const,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
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

