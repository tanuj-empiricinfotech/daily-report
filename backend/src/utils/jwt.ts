import jwt from 'jsonwebtoken';
import type { JwtPayload } from '../types';
import { envConfig } from '../config/env.config';

/**
 * Get JWT secret with validation
 * Uses validated environment configuration
 */
const JWT_SECRET: string = envConfig.jwtSecret;
const JWT_EXPIRES_IN: string = envConfig.jwtExpiresIn;

export const generateToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  } as jwt.SignOptions);
};

export const verifyToken = (token: string): JwtPayload => {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};

