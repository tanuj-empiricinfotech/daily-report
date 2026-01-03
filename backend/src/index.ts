import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import routes from './routes';
import { errorHandler } from './middleware/errorHandler';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Constants for allowed origins (following clean code guidelines - avoid magic strings)
const LOCALHOST_ORIGIN = 'http://localhost:5173';
const PRODUCTION_FRONTEND_URL = 'https://daily-report-omega.vercel.app';

// Allowed origin patterns for development tunnels and deployment platforms
const ALLOWED_ORIGIN_PATTERNS = {
  ngrok: /^https?:\/\/[a-zA-Z0-9-]+\.(ngrok\.io|ngrok-free\.app|ngrok\.app)(:\d+)?$/,
  vercel: /^https:\/\/daily-report-[a-z0-9-]+\.vercel\.app$/,
  pinggy: /^https?:\/\/[a-zA-Z0-9-]+\..*\.pinggy\.(link|io|online)$/,
};

/**
 * CORS origin validation function
 * Allows requests from:
 * - localhost development (http://localhost:5173)
 * - Production Vercel deployment (https://daily-report-omega.vercel.app)
 * - Vercel preview deployments
 * - Environment-configured frontend URL
 * - Ngrok tunnels
 * - Pinggy tunnels
 * - Requests with no origin (mobile apps, CURL)
 */
const corsOrigin = (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
  // Allow requests with no origin (like mobile apps or curl requests)
  if (!origin) {
    return callback(null, true);
  }

  // Allow localhost development
  if (origin === LOCALHOST_ORIGIN) {
    return callback(null, true);
  }

  // Allow production Vercel URL
  if (origin === PRODUCTION_FRONTEND_URL) {
    return callback(null, true);
  }

  // Allow FRONTEND_URL from environment variable
  if (origin === FRONTEND_URL) {
    return callback(null, true);
  }

  // Allow any ngrok URL (development tunnels)
  if (ALLOWED_ORIGIN_PATTERNS.ngrok.test(origin)) {
    return callback(null, true);
  }

  // Allow Vercel preview deployments
  if (ALLOWED_ORIGIN_PATTERNS.vercel.test(origin)) {
    return callback(null, true);
  }

  // Allow Pinggy tunnels
  if (ALLOWED_ORIGIN_PATTERNS.pinggy.test(origin)) {
    return callback(null, true);
  }

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
  console.log(`Server is running on port ${PORT}`);
});

