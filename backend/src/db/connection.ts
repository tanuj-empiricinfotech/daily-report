import { Pool, PoolConfig, types } from 'pg';
import dotenv from 'dotenv';
import logger from '../utils/logger';
import { DB_CONFIG } from '../config/app.config';
import { envConfig } from '../config/env.config';

dotenv.config();

/**
 * Configure pg driver to return DATE values as strings instead of Date objects.
 *
 * By default, the pg driver converts PostgreSQL DATE columns to JavaScript Date objects,
 * which include time and timezone components. This causes issues with date-only values:
 * - A DATE value "2026-01-03" gets converted to a Date object
 * - When serialized to JSON, it becomes "2026-01-02T18:30:00.000Z" (with timezone offset)
 * - The calendar date shifts due to timezone conversion
 *
 * Solution: Configure pg to return DATE values as plain strings (YYYY-MM-DD format).
 * This keeps dates timezone-agnostic and prevents unwanted date shifts.
 *
 * Type OID 1082 is PostgreSQL's internal type ID for DATE columns.
 */
types.setTypeParser(types.builtins.DATE, (val: string) => val);

/**
 * Parses a PostgreSQL connection URL into connection config
 * Format: postgresql://user:password@host:port/database
 */
const parseDatabaseUrl = (url: string): Partial<PoolConfig> => {
  try {
    const parsedUrl = new URL(url);
    return {
      host: parsedUrl.hostname,
      port: parseInt(parsedUrl.port || '5432', 10),
      database: parsedUrl.pathname.slice(1), // Remove leading '/'
      user: parsedUrl.username,
      password: parsedUrl.password,
    };
  } catch (error) {
    logger.error('Failed to parse DATABASE_URL', { error });
    throw new Error('Invalid DATABASE_URL format');
  }
};

/**
 * Builds pool configuration from environment variables
 * Priority: DATABASE_URL > Individual DB_* variables > Defaults
 */
const buildPoolConfig = (): PoolConfig => {
  // If DATABASE_URL is provided, use it (Railway, Heroku, etc.)
  if (envConfig.databaseUrl) {
    const parsedConfig = parseDatabaseUrl(envConfig.databaseUrl);
    return {
      ...parsedConfig,
      max: DB_CONFIG.MAX_CONNECTIONS,
      idleTimeoutMillis: DB_CONFIG.IDLE_TIMEOUT_MS,
      connectionTimeoutMillis: DB_CONFIG.CONNECTION_TIMEOUT_MS,
    } as PoolConfig;
  }

  // Fall back to individual environment variables
  return {
    host: envConfig.dbHost,
    port: envConfig.dbPort,
    database: envConfig.dbName,
    user: envConfig.dbUser,
    password: envConfig.dbPassword,
    max: DB_CONFIG.MAX_CONNECTIONS,
    idleTimeoutMillis: DB_CONFIG.IDLE_TIMEOUT_MS,
    connectionTimeoutMillis: DB_CONFIG.CONNECTION_TIMEOUT_MS,
  };
};

const poolConfig = buildPoolConfig();

// Log connection config in development (without sensitive data)
if (envConfig.nodeEnv === 'development') {
  logger.debug('Database connection configuration', {
    host: poolConfig.host,
    port: poolConfig.port,
    database: poolConfig.database,
    user: poolConfig.user,
    hasPassword: !!poolConfig.password,
    maxConnections: poolConfig.max,
  });
}

const pool = new Pool(poolConfig);

let connectionErrorCount = 0;
const MAX_CONNECTION_ERRORS = 5;
const CONNECTION_ERROR_RESET_MS = 60000; // Reset counter after 1 minute

pool.on('error', (err: Error) => {
  connectionErrorCount++;
  logger.error('Unexpected error on idle database client', { 
    error: err.message,
    errorCount: connectionErrorCount 
  });

  // Only exit if we've had too many errors in a short time
  // This prevents cascading failures from a temporary network issue
  if (connectionErrorCount >= MAX_CONNECTION_ERRORS) {
    logger.error('Too many database connection errors. Exiting to prevent further issues.', {
      errorCount: connectionErrorCount,
    });
    // Give time for graceful shutdown
    setTimeout(() => {
      process.exit(1);
    }, 1000);
  }

  // Reset error count after a period
  setTimeout(() => {
    connectionErrorCount = Math.max(0, connectionErrorCount - 1);
  }, CONNECTION_ERROR_RESET_MS);
});

export const query = async (text: string, params?: any[]) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    
    // Only log queries in development to avoid performance impact and sensitive data exposure
    if (envConfig.nodeEnv === 'development') {
      logger.debug('Executed query', { 
        duration, 
        rows: res.rowCount,
        // Don't log full query text in production to avoid exposing sensitive data
        queryPreview: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
      });
    }
    
    return res;
  } catch (error) {
    logger.error('Database query error', { 
      error: error instanceof Error ? error.message : 'Unknown error',
      // Log query preview for debugging but not full query
      queryPreview: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
    });
    throw error;
  }
};

export const getClient = async () => {
  const client = await pool.connect();
  return client;
};

export default pool;

