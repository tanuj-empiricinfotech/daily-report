import rateLimit from 'express-rate-limit';
import { RATE_LIMIT_CONFIG } from '../config/password.config';

export const passwordChangeRateLimiter = rateLimit({
  windowMs: RATE_LIMIT_CONFIG.PASSWORD_CHANGE.WINDOW_MS,
  max: RATE_LIMIT_CONFIG.PASSWORD_CHANGE.MAX_ATTEMPTS,
  message: RATE_LIMIT_CONFIG.PASSWORD_CHANGE.MESSAGE,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: RATE_LIMIT_CONFIG.PASSWORD_CHANGE.MESSAGE,
    });
  },
});
