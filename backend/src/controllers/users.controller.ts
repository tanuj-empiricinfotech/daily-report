import bcrypt from 'bcryptjs';
import { Response, NextFunction } from 'express';
import { UsersRepository } from '../db/repositories/users.repository';
import { AuthRequest } from '../middleware/auth';
import { CreateUserDto } from '../types';
import { BadRequestError, NotFoundError } from '../utils/errors';

export class UsersController {
  private usersRepository: UsersRepository;

  constructor() {
    this.usersRepository = new UsersRepository();
  }

  getAll = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const users = await this.usersRepository.findAll();
      const usersWithoutPassword = users.map((user) => {
        const { password_hash, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
      res.json({
        success: true,
        data: usersWithoutPassword,
      });
    } catch (error) {
      next(error);
    }
  };

  getByTeam = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const teamId = parseInt(req.params.teamId, 10);
      const users = await this.usersRepository.findByTeamId(teamId);
      const usersWithoutPassword = users.map((user) => {
        const { password_hash, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
      res.json({
        success: true,
        data: usersWithoutPassword,
      });
    } catch (error) {
      next(error);
    }
  };

  create = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data: CreateUserDto = req.body;
      
      const existingUser = await this.usersRepository.findByEmail(data.email);
      if (existingUser) {
        throw new BadRequestError('User with this email already exists');
      }

      const passwordHash = await bcrypt.hash(data.password, 10);
      const user = await this.usersRepository.create(data, passwordHash);
      
      const { password_hash, ...userWithoutPassword } = user;
      res.status(201).json({
        success: true,
        data: userWithoutPassword,
      });
    } catch (error) {
      next(error);
    }
  };

  update = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = parseInt(req.params.id, 10);
      const data: Partial<CreateUserDto> = req.body;

      const existingUser = await this.usersRepository.findById(id);
      if (!existingUser) {
        throw new NotFoundError('User not found');
      }

      if (data.email && data.email !== existingUser.email) {
        const emailExists = await this.usersRepository.findByEmail(data.email);
        if (emailExists) {
          throw new BadRequestError('User with this email already exists');
        }
      }

      const updateData: Partial<CreateUserDto & { password_hash?: string }> = { ...data };
      if (data.password) {
        updateData.password_hash = await bcrypt.hash(data.password, 10);
        delete updateData.password;
      }

      const user = await this.usersRepository.update(id, updateData);
      if (!user) {
        throw new NotFoundError('User not found');
      }
      
      const { password_hash, ...userWithoutPassword } = user;
      res.json({
        success: true,
        data: userWithoutPassword,
      });
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = parseInt(req.params.id, 10);
      
      const user = await this.usersRepository.findById(id);
      if (!user) {
        throw new NotFoundError('User not found');
      }

      await this.usersRepository.delete(id);
      res.json({
        success: true,
        message: 'User deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  };
}

