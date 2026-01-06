import { BaseRepository } from './base.repository';
import { User, CreateUserDto, UserWithProjectsAndTeam } from '../../types';
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

  async delete(id: number): Promise<boolean> {
    const result = await query(
      `DELETE FROM ${this.tableName} WHERE id = $1`,
      [id]
    );
    return result.rowCount !== null && result.rowCount > 0;
  }

  /**
   * Returns all users for the supplied team_id with their assigned projects and team name.
   * Each user object includes a 'projects' field containing an array of project objects
   * and a 'team_name' field with the team name.
   * Projects array is empty if the user has no assigned projects.
   * @param teamId The id of the team whose users should be fetched.
   */
  async findAllWithProjectsByTeamId(teamId: number): Promise<UserWithProjectsAndTeam[]> {
    const result = await query(
      `SELECT 
        u.id,
        u.email,
        u.name,
        u.role,
        u.team_id,
        u.created_at,
        u.updated_at,
        t.name AS team_name,
        COALESCE(
          json_agg(
            json_build_object(
              'id', p.id,
              'name', p.name,
              'description', p.description,
              'team_id', p.team_id,
              'created_by', p.created_by,
              'created_at', p.created_at,
              'updated_at', p.updated_at,
              'assigned_at', pa.assigned_at
            )
          ) FILTER (WHERE p.id IS NOT NULL),
          '[]'::json
        ) AS projects
      FROM ${this.tableName} u
      LEFT JOIN teams t ON u.team_id = t.id
      LEFT JOIN project_assignments pa ON u.id = pa.user_id
      LEFT JOIN projects p ON pa.project_id = p.id
      WHERE u.team_id = $1
      GROUP BY u.id, u.email, u.name, u.role, u.team_id, u.created_at, u.updated_at, t.name
      ORDER BY u.id`,
      [teamId]
    );
    return result.rows;
  }
}

