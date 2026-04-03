/**
 * JWT Token Utilities
 * Uses HS512 algorithm for stronger token signing.
 */

import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-change-this';
const ALGORITHM = 'HS512';

interface TokenPayload {
  userId: number;
  email: string;
  role: string;
}

const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';

export function generateAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { algorithm: ALGORITHM, expiresIn: ACCESS_TOKEN_EXPIRY });
}

export function generateRefreshToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { algorithm: ALGORITHM, expiresIn: REFRESH_TOKEN_EXPIRY });
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, JWT_SECRET, { algorithms: [ALGORITHM] }) as TokenPayload;
}

// Keep old function name for backward compatibility during transition
export { generateAccessToken as generateToken };
