import bcrypt from 'bcryptjs';
import { UsersRepository } from '../db/repositories/users.repository';
import { CreateUserDto, User } from '../types';
import { generateToken } from '../utils/jwt';
import type { JwtPayload } from '../types';
import { BadRequestError, UnauthorizedError } from '../utils/errors';
import { PASSWORD_CONFIG, PASSWORD_ERROR_MESSAGES } from '../config/password.config';

export class AuthService {
  private usersRepository: UsersRepository;

  constructor() {
    this.usersRepository = new UsersRepository();
  }

  async register(data: CreateUserDto): Promise<{ user: Omit<User, 'password_hash'>; token: string }> {
    const existingUser = await this.usersRepository.findByEmail(data.email);
    if (existingUser) {
      throw new BadRequestError('User with this email already exists');
    }

    const passwordHash = await bcrypt.hash(data.password, 10);
    const user = await this.usersRepository.create(data, passwordHash);

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const { password_hash, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, token };
  }

  async login(email: string, password: string): Promise<{ user: Omit<User, 'password_hash'>; token: string }> {
    const user = await this.usersRepository.findByEmail(email);
    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const { password_hash, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, token };
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
  }
}

