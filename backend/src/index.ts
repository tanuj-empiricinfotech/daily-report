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

// CORS origin function to allow localhost:5173 and any ngrok URL
const corsOrigin = (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
  // Allow requests with no origin (like mobile apps or curl requests)
  if (!origin) {
    return callback(null, true);
  }

  // Allow localhost:5173
  if (origin === 'http://localhost:5173' || origin === FRONTEND_URL) {
    return callback(null, true);
  }

  // Allow any ngrok URL (ngrok.io, ngrok-free.app, ngrok.app, etc.)
  const ngrokPattern = /^https?:\/\/[a-zA-Z0-9-]+\.(ngrok\.io|ngrok-free\.app|ngrok\.app)(:\d+)?$/;
  if (ngrokPattern.test(origin)) {
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

