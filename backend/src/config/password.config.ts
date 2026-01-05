export const PASSWORD_CONFIG = {
  MIN_LENGTH: 6,
  MAX_LENGTH: 128,
  BCRYPT_SALT_ROUNDS: 10,
  REQUIRE_UPPERCASE: false,
  REQUIRE_LOWERCASE: false,
  REQUIRE_NUMBERS: false,
  REQUIRE_SPECIAL: false,
} as const;

export const PASSWORD_ERROR_MESSAGES = {
  CURRENT_INCORRECT: 'Current password is incorrect',
  TOO_SHORT: `Password must be at least ${PASSWORD_CONFIG.MIN_LENGTH} characters`,
  SAME_AS_CURRENT: 'New password must be different from current password',
  REQUIRED: 'Password is required',
  INVALID_FORMAT: 'Password format is invalid',
} as const;

export const RATE_LIMIT_CONFIG = {
  PASSWORD_CHANGE: {
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    MAX_ATTEMPTS: 5,
    MESSAGE: 'Too many password change attempts. Please try again later.',
  },
} as const;
