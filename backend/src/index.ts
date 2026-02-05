import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import routes from './routes';
import { errorHandler } from './middleware/errorHandler';
import { initializeJobs } from './jobs';
import { validateEnvironmentVariables, envConfig } from './config/env.config';
import logger from './utils/logger';
import { SERVER_CONFIG } from './config/app.config';

dotenv.config();

// Validate environment variables before starting server
try {
  validateEnvironmentVariables();
} catch (error) {
  logger.error('Failed to start server due to environment validation errors', { error });
  process.exit(1);
}

const app = express();
const PORT = envConfig.port;

/**
 * Trust proxy configuration
 * When deployed behind reverse proxies (Render, Heroku, Railway, etc.),
 * Express needs to trust the X-Forwarded-* headers to correctly detect:
 * - req.protocol (http vs https)
 * - req.secure (boolean for HTTPS)
 * - req.ip (client IP address)
 *
 * Set to 1 to trust the first proxy in the chain
 */
app.set('trust proxy', SERVER_CONFIG.TRUST_PROXY);

// Environment configuration (following clean code principles - configuration management)
const FRONTEND_URL = envConfig.frontendUrl;
const LOCALHOST_DEV_URL = 'http://localhost:5173';

// Allowed origin patterns for development tunnels and deployment platforms
const ALLOWED_ORIGIN_PATTERNS = {
  ngrok: /^https?:\/\/[a-zA-Z0-9-]+\.(ngrok\.io|ngrok-free\.app|ngrok\.app)(:\d+)?$/,
  vercel: /^https:\/\/[a-zA-Z0-9-]+\.vercel\.app$/,
  pinggy: /^https?:\/\/[a-zA-Z0-9-]+\..*\.pinggy\.(link|io|online)$/,
};

/**
 * CORS origin validation function
 * Allows requests from:
 * - Environment-configured frontend URL (FRONTEND_URL)
 * - Localhost development (default fallback)
 * - Vercel deployments (production and preview)
 * - Development tunnels (ngrok, pinggy)
 * - Requests with no origin (mobile apps, CURL)
 */
const corsOrigin = (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
  // Allow requests with no origin (like mobile apps or curl requests)
  if (!origin) {
    logger.debug('CORS: No origin provided - allowing');
    return callback(null, true);
  }

  logger.debug('CORS: Checking origin', { origin });

  // Allow environment-configured frontend URL
  if (origin === FRONTEND_URL) {
    logger.debug('CORS: Matched FRONTEND_URL', { frontendUrl: FRONTEND_URL });
    return callback(null, true);
  }

  // Allow localhost development (fallback for dev environment)
  if (origin === LOCALHOST_DEV_URL) {
    logger.debug('CORS: Matched localhost dev URL');
    return callback(null, true);
  }

  // Allow any ngrok URL (development tunnels)
  if (ALLOWED_ORIGIN_PATTERNS.ngrok.test(origin)) {
    logger.debug('CORS: Matched ngrok pattern');
    return callback(null, true);
  }

  // Allow Vercel deployments (production and preview)
  if (ALLOWED_ORIGIN_PATTERNS.vercel.test(origin)) {
    logger.debug('CORS: Matched Vercel pattern');
    return callback(null, true);
  }

  // Allow Pinggy tunnels
  if (ALLOWED_ORIGIN_PATTERNS.pinggy.test(origin)) {
    logger.debug('CORS: Matched Pinggy pattern');
    return callback(null, true);
  }

  logger.warn('CORS: Origin not allowed', { origin });
  callback(new Error('Not allowed by CORS'));
};

app.use(cors({
  origin: corsOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Access-Control-Allow-Origin', 'ngrok-skip-browser-warning', 'X-Pinggy-No-Screen'],
  exposedHeaders: ['Set-Cookie'],
}));
app.use(express.json());
app.use(cookieParser());

app.use('/api', routes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use(errorHandler);

app.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`);

  // Initialize scheduled jobs after server starts
  initializeJobs();
});

