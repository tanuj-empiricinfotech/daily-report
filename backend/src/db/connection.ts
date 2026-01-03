import { Pool, PoolConfig } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

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
    console.error('Failed to parse DATABASE_URL:', error);
    throw new Error('Invalid DATABASE_URL format');
  }
};

/**
 * Builds pool configuration from environment variables
 * Priority: DATABASE_URL > Individual DB_* variables > Defaults
 */
const buildPoolConfig = (): PoolConfig => {
  // If DATABASE_URL is provided, use it (Railway, Heroku, etc.)
  if (process.env.DATABASE_URL) {
    const parsedConfig = parseDatabaseUrl(process.env.DATABASE_URL);
    return {
      ...parsedConfig,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    } as PoolConfig;
  }

  // Fall back to individual environment variables
  return {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME || 'daily_report',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  };
};

const poolConfig = buildPoolConfig();

const pool = new Pool(poolConfig);

pool.on('error', (err: Error) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

export const query = async (text: string, params?: any[]) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('Database query error', { text, error });
    throw error;
  }
};

export const getClient = async () => {
  const client = await pool.connect();
  return client;
};

export default pool;

