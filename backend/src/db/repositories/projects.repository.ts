import { BaseRepository } from './base.repository';
import { Project, CreateProjectDto } from '../../types';
import { query } from '../connection';

export class ProjectsRepository extends BaseRepository<Project> {
  protected tableName = 'projects';

  async create(data: CreateProjectDto, createdBy: number): Promise<Project> {
    const result = await query(
      `INSERT INTO ${this.tableName} (team_id, name, description, created_by)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [data.team_id, data.name, data.description || null, createdBy]
    );
    return result.rows[0];
  }

  async update(id: number, data: Partial<CreateProjectDto>): Promise<Project | null> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (data.name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(data.name);
    }
    if (data.description !== undefined) {
      updates.push(`description = $${paramCount++}`);
      values.push(data.description);
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

  async findByTeamId(teamId: number): Promise<Project[]> {
    const result = await query(
      `SELECT * FROM ${this.tableName} WHERE team_id = $1`,
      [teamId]
    );
    return result.rows;
  }

  async findByUserId(userId: number): Promise<Project[]> {
    const result = await query(
      `SELECT DISTINCT p.*
       FROM ${this.tableName} p
       INNER JOIN project_assignments pa ON p.id = pa.project_id
       WHERE pa.user_id = $1`,
      [userId]
    );
    return result.rows;
  }

  async findByTeamIdOrUserId(teamId: number | null, userId: number): Promise<Project[]> {
    if (teamId) {
      const result = await query(
        `SELECT DISTINCT p.*
         FROM ${this.tableName} p
         LEFT JOIN project_assignments pa ON p.id = pa.project_id
         WHERE p.team_id = $1 OR pa.user_id = $2`,
        [teamId, userId]
      );
      return result.rows;
    }
    return this.findByUserId(userId);
  }
}

