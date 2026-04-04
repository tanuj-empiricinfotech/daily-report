import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { UsersRepository } from '../db/repositories/users.repository';
import { RefreshTokensRepository } from '../db/repositories/refresh-tokens.repository';
import { CreateUserDto, User } from '../types';
import { generateAccessToken, generateRefreshToken, verifyToken } from '../utils/jwt';
import type { JwtPayload } from '../types';
import { BadRequestError, ForbiddenError, UnauthorizedError } from '../utils/errors';
import { PASSWORD_CONFIG, PASSWORD_ERROR_MESSAGES } from '../config/password.config';

const REFRESH_TOKEN_EXPIRY_DAYS = 7;

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function getRefreshTokenExpiryDate(): Date {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);
  return expiresAt;
}

export class AuthService {
  private usersRepository: UsersRepository;
  private refreshTokensRepository: RefreshTokensRepository;

  constructor() {
    this.usersRepository = new UsersRepository();
    this.refreshTokensRepository = new RefreshTokensRepository();
  }

  async register(
    data: CreateUserDto,
    deviceInfo?: string
  ): Promise<{ user: Omit<User, 'password_hash'>; accessToken: string; refreshToken: string }> {
    const existingUser = await this.usersRepository.findByEmail(data.email);
    if (existingUser) {
      throw new BadRequestError('User with this email already exists');
    }

    const passwordHash = await bcrypt.hash(data.password, 10);
    const user = await this.usersRepository.create(data, passwordHash);

    const tokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    await this.refreshTokensRepository.create(
      user.id,
      hashToken(refreshToken),
      deviceInfo ?? null,
      getRefreshTokenExpiryDate()
    );

    const { password_hash, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, accessToken, refreshToken };
  }

  async login(
    email: string,
    password: string,
    deviceInfo?: string
  ): Promise<{ user: Omit<User, 'password_hash'>; accessToken: string; refreshToken: string }> {
    const user = await this.usersRepository.findByEmail(email);
    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    if (user.is_active === false) {
      throw new ForbiddenError('Your account has been deactivated. Contact your administrator.');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const tokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    await this.refreshTokensRepository.create(
      user.id,
      hashToken(refreshToken),
      deviceInfo ?? null,
      getRefreshTokenExpiryDate()
    );

    const { password_hash, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, accessToken, refreshToken };
  }

  async refreshAccessToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    const payload = verifyToken(refreshToken);

    const tokenHash = hashToken(refreshToken);
    const storedToken = await this.refreshTokensRepository.findByTokenHash(tokenHash);

    if (!storedToken) {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    // Issue a new access token without rotating the refresh token.
    // This avoids race conditions with concurrent refresh calls
    // (e.g. background interval + 401 retry, or multiple devices).
    const newAccessToken = generateAccessToken({
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
    });

    return { accessToken: newAccessToken, refreshToken };
  }

  async revokeRefreshToken(refreshToken: string): Promise<void> {
    const tokenHash = hashToken(refreshToken);
    await this.refreshTokensRepository.deleteByTokenHash(tokenHash);
  }

  async revokeAllUserSessions(userId: number): Promise<number> {
    return this.refreshTokensRepository.deleteAllByUserId(userId);
  }

  async getUserSessions(userId: number, currentRefreshToken?: string): Promise<Array<{ id: number; device_info: string | null; created_at: Date; is_current: boolean }>> {
    const tokens = await this.refreshTokensRepository.findByUserId(userId);
    const currentHash = currentRefreshToken ? hashToken(currentRefreshToken) : null;

    return tokens.map(t => ({
      id: t.id,
      device_info: t.device_info,
      created_at: t.created_at,
      is_current: currentHash ? t.token_hash === currentHash : false,
    }));
  }

  async revokeSession(sessionId: number, userId: number): Promise<boolean> {
    return this.refreshTokensRepository.deleteById(sessionId, userId);
  }

  async revokeOtherSessions(userId: number, currentRefreshToken: string): Promise<number> {
    const currentHash = hashToken(currentRefreshToken);
    const tokens = await this.refreshTokensRepository.findByUserId(userId);
    let revoked = 0;
    for (const token of tokens) {
      if (token.token_hash !== currentHash) {
        await this.refreshTokensRepository.deleteById(token.id, userId);
        revoked++;
      }
    }
    return revoked;
  }

  async changePassword(userId: number, currentPassword: string, newPassword: string): Promise<void> {
    const user = await this.usersRepository.findById(userId);
    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isCurrentPasswordValid) {
      throw new UnauthorizedError(PASSWORD_ERROR_MESSAGES.CURRENT_INCORRECT);
    }

    const isSameAsCurrentPassword = await bcrypt.compare(newPassword, user.password_hash);
    if (isSameAsCurrentPassword) {
      throw new BadRequestError(PASSWORD_ERROR_MESSAGES.SAME_AS_CURRENT);
    }

    const newPasswordHash = await bcrypt.hash(newPassword, PASSWORD_CONFIG.BCRYPT_SALT_ROUNDS);
    await this.usersRepository.update(userId, { password_hash: newPasswordHash });

    // Revoke all sessions so user must log in with new password
    await this.refreshTokensRepository.deleteAllByUserId(userId);
  }
}

