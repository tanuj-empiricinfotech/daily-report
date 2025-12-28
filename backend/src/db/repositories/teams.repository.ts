import { BaseRepository } from './base.repository';
import { Team, CreateTeamDto } from '../../types';
import { query } from '../connection';

export class TeamsRepository extends BaseRepository<Team> {
  protected tableName = 'teams';

  async create(data: CreateTeamDto, createdBy: number): Promise<Team> {
    const result = await query(
      `INSERT INTO ${this.tableName} (name, description, created_by)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [data.name, data.description || null, createdBy]
    );
    return result.rows[0];
  }

  async update(id: number, data: Partial<CreateTeamDto>): Promise<Team | null> {
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

  async findByCreatedBy(userId: number): Promise<Team[]> {
    const result = await query(
      `SELECT * FROM ${this.tableName} WHERE created_by = $1`,
      [userId]
    );
    return result.rows;
  }
}

