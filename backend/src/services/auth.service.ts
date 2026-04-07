import bcrypt from 'bcryptjs';
import { UsersRepository } from '../db/repositories/users.repository';
import { RefreshTokensRepository } from '../db/repositories/refresh-tokens.repository';
import { CreateUserDto, User } from '../types';
import { generateToken } from '../utils/jwt';
import { BadRequestError, ForbiddenError, UnauthorizedError } from '../utils/errors';
import { PASSWORD_CONFIG, PASSWORD_ERROR_MESSAGES } from '../config/password.config';

const SESSION_EXPIRY_DAYS = 7;

function getSessionExpiryDate(): Date {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_EXPIRY_DAYS);
  return expiresAt;
}

export class AuthService {
  private usersRepository: UsersRepository;
  private sessionsRepository: RefreshTokensRepository;

  constructor() {
    this.usersRepository = new UsersRepository();
    this.sessionsRepository = new RefreshTokensRepository();
  }

  async register(
    data: CreateUserDto,
    deviceInfo?: string
  ): Promise<{ user: Omit<User, 'password_hash'>; token: string }> {
    const existingUser = await this.usersRepository.findByEmail(data.email);
    if (existingUser) {
      throw new BadRequestError('User with this email already exists');
    }

    const passwordHash = await bcrypt.hash(data.password, 10);
    const user = await this.usersRepository.create(data, passwordHash);

    // Create session record
    const session = await this.sessionsRepository.create(
      user.id,
      null, // Session is identified by its row id (carried in the JWT)
      deviceInfo ?? null,
      getSessionExpiryDate()
    );

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      sessionId: session.id,
    });

    const { password_hash, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, token };
  }

  async login(
    email: string,
    password: string,
    deviceInfo?: string
  ): Promise<{ user: Omit<User, 'password_hash'>; token: string }> {
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

    // Create session record
    const session = await this.sessionsRepository.create(
      user.id,
      '',
      deviceInfo ?? null,
      getSessionExpiryDate()
    );

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      sessionId: session.id,
    });

    const { password_hash, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, token };
  }

  async revokeSession(sessionId: number, userId: number): Promise<boolean> {
    return this.sessionsRepository.deleteById(sessionId, userId);
  }

  async revokeAllUserSessions(userId: number): Promise<number> {
    return this.sessionsRepository.deleteAllByUserId(userId);
  }

  async getUserSessions(userId: number, currentSessionId?: number): Promise<Array<{ id: number; device_info: string | null; created_at: Date; is_current: boolean }>> {
    const sessions = await this.sessionsRepository.findByUserId(userId);

    return sessions.map(s => ({
      id: s.id,
      device_info: s.device_info,
      created_at: s.created_at,
      is_current: currentSessionId ? s.id === currentSessionId : false,
    }));
  }

  async revokeOtherSessions(userId: number, currentSessionId: number): Promise<number> {
    const sessions = await this.sessionsRepository.findByUserId(userId);
    let revoked = 0;
    for (const session of sessions) {
      if (session.id !== currentSessionId) {
        await this.sessionsRepository.deleteById(session.id, userId);
        revoked++;
      }
    }
    return revoked;
  }

  async isSessionValid(sessionId: number): Promise<boolean> {
    return this.sessionsRepository.existsById(sessionId);
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
    await this.sessionsRepository.deleteAllByUserId(userId);
  }
}
