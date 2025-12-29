import { BaseRepository } from './base.repository';
import { User, CreateUserDto } from '../../types';
import { query } from '../connection';

export class UsersRepository extends BaseRepository<User> {
  protected tableName = 'users';

  async create(data: CreateUserDto, passwordHash: string): Promise<User> {
    const result = await query(
      `INSERT INTO ${this.tableName} (email, password_hash, name, role, team_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [data.email, passwordHash, data.name, data.role, data.team_id || null]
    );
    return result.rows[0];
  }

  async findByEmail(email: string): Promise<User | null> {
    const result = await query(
      `SELECT * FROM ${this.tableName} WHERE email = $1`,
      [email]
    );
    return result.rows[0] || null;
  }

  async findByTeamId(teamId: number): Promise<User[]> {
    const result = await query(
      `SELECT * FROM ${this.tableName} WHERE team_id = $1`,
      [teamId]
    );
    return result.rows;
  }

  async update(id: number, data: Partial<CreateUserDto & { password_hash?: string; email?: string }>): Promise<User | null> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (data.email !== undefined) {
      updates.push(`email = $${paramCount++}`);
      values.push(data.email);
    }
    if (data.name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(data.name);
    }
    if (data.role !== undefined) {
      updates.push(`role = $${paramCount++}`);
      values.push(data.role);
    }
    if (data.team_id !== undefined) {
      updates.push(`team_id = $${paramCount++}`);
      values.push(data.team_id);
    }
    if (data.password_hash !== undefined) {
      updates.push(`password_hash = $${paramCount++}`);
      values.push(data.password_hash);
    }

    if (updates.length === 0) {
      return this.findById(id);
    }

    values.push(id);
    const result = await query(
      `UPDATE ${this.tableName} SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );
    return result.rows[0] || null;
  }

  async findAllMembers(): Promise<User[]> {
    const result = await query(
      `SELECT * FROM ${this.tableName} WHERE role = 'member'`
    );
    return result.rows;
  }
}

