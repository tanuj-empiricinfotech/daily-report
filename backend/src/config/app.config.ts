/**
 * Application-level configuration constants
 * 
 * Centralizes magic numbers and shared constants
 */

/**
 * Cookie configuration
 */
export const COOKIE_CONFIG = {
  MAX_AGE_DAYS: 7,
  get MAX_AGE_MS(): number {
    return this.MAX_AGE_DAYS * 24 * 60 * 60 * 1000;
  },
} as const;

/**
 * Server configuration
 */
export const SERVER_CONFIG = {
  DEFAULT_PORT: 3000,
  TRUST_PROXY: 1,
} as const;

/**
 * Database connection configuration
 */
export const DB_CONFIG = {
  MAX_CONNECTIONS: 20,
  IDLE_TIMEOUT_MS: 30000,
  CONNECTION_TIMEOUT_MS: 2000,
} as const;
