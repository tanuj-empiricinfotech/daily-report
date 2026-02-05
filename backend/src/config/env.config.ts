/**
 * Environment variable validation and configuration
 * 
 * Validates required environment variables at startup
 * Provides type-safe access to environment configuration
 */

import dotenv from 'dotenv';
import logger from '../utils/logger';

// Ensure environment variables are loaded before reading them
dotenv.config();

const DEFAULT_JWT_SECRET = 'your-secret-key';
const isProduction = process.env.NODE_ENV === 'production';

interface EnvConfig {
  // Database
  databaseUrl?: string;
  dbHost: string;
  dbPort: number;
  dbName: string;
  dbUser: string;
  dbPassword: string;

  // Server
  port: number;
  nodeEnv: string;
  frontendUrl: string;

  // JWT
  jwtSecret: string;
  jwtExpiresIn: string;

  // HTTPS
  backendHttps: boolean;

  // Timezone
  timezoneOffsetHours: number;

  // Teams Integration
  enableTeamsSummary: boolean;
  teamsWebhookUrl?: string;

  // Admin
  adminEmail: string;
  adminPassword: string;
  adminName: string;
}

/**
 * Validates that JWT_SECRET is set and not the default value
 */
function validateJwtSecret(): void {
  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    if (isProduction) {
      throw new Error('JWT_SECRET environment variable is required in production');
    }
    logger.warn('JWT_SECRET not set, using default value. This should be changed in production.');
    return;
  }

  if (jwtSecret === DEFAULT_JWT_SECRET && isProduction) {
    throw new Error('JWT_SECRET must be changed from default value in production');
  }

  if (jwtSecret.length < 32 && isProduction) {
    logger.warn('JWT_SECRET is shorter than 32 characters. Consider using a longer, more secure secret.');
  }
}

/**
 * Validates required environment variables
 * Throws error if critical variables are missing in production
 */
export function validateEnvironmentVariables(): void {
  const errors: string[] = [];

  // Validate JWT secret
  try {
    validateJwtSecret();
  } catch (error) {
    errors.push(error instanceof Error ? error.message : 'JWT_SECRET validation failed');
  }

  // Check for required variables in production
  if (isProduction) {
    if (!process.env.JWT_SECRET) {
      errors.push('JWT_SECRET is required in production');
    }
  }

  if (errors.length > 0) {
    const errorMessage = `Environment variable validation failed:\n${errors.join('\n')}`;
    logger.error(errorMessage);
    throw new Error(errorMessage);
  }

  logger.info('Environment variables validated successfully');
}

/**
 * Builds environment configuration without validation
 * Validation should be called separately via validateEnvironmentVariables()
 */
export function getEnvConfig(): EnvConfig {
  return {
    // Database
    databaseUrl: process.env.DATABASE_URL,
    dbHost: process.env.DB_HOST || 'localhost',
    dbPort: parseInt(process.env.DB_PORT || '5432', 10),
    dbName: process.env.DB_NAME || 'daily_report',
    dbUser: process.env.DB_USER || 'postgres',
    dbPassword: process.env.DB_PASSWORD || 'postgres',

    // Server
    port: parseInt(process.env.PORT || '3000', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',

    // JWT
    jwtSecret: process.env.JWT_SECRET || DEFAULT_JWT_SECRET,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',

    // HTTPS
    backendHttps: process.env.BACKEND_HTTPS === 'true',

    // Timezone
    timezoneOffsetHours: parseFloat(process.env.TIMEZONE_OFFSET_HOURS || '5.5'),

    // Teams Integration
    enableTeamsSummary: process.env.ENABLE_TEAMS_SUMMARY === 'true',
    teamsWebhookUrl: process.env.TEAMS_WEBHOOK_URL,

    // Admin
    adminEmail: process.env.ADMIN_EMAIL || 'admin@example.com',
    adminPassword: process.env.ADMIN_PASSWORD || 'ChangeMe123!',
    adminName: process.env.ADMIN_NAME || 'Admin User',
  };
}

// Export config (created after dotenv.config() has been called)
// Note: Validation is done separately in index.ts via validateEnvironmentVariables()
export const envConfig = getEnvConfig();
