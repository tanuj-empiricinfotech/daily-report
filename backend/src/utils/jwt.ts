/**
 * JWT Token Utilities
 * Uses HS256 algorithm for token signing.
 * Single long-lived token (7 days) with session tracking.
 */

import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-change-this';
const ALGORITHM = 'HS256';

interface TokenPayload {
  userId: number;
  email: string;
  role: string;
  sessionId: number;
}

const TOKEN_EXPIRY = '7d';

export function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { algorithm: ALGORITHM, expiresIn: TOKEN_EXPIRY });
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, JWT_SECRET, { algorithms: [ALGORITHM] }) as TokenPayload;
}
