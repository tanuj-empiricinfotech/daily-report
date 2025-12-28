import { BaseRepository } from './base.repository';
import { DailyLog, CreateLogDto, UpdateLogDto } from '../../types';
import { query } from '../connection';

export class LogsRepository extends BaseRepository<DailyLog> {
  protected tableName = 'daily_logs';

  async create(data: CreateLogDto, userId: number): Promise<DailyLog> {
    const result = await query(
      `INSERT INTO ${this.tableName} (user_id, project_id, date, task_description, actual_time_spent, tracked_time)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        userId,
        data.project_id,
        data.date,
        data.task_description,
        data.actual_time_spent,
        data.tracked_time,
      ]
    );
    return result.rows[0];
  }

  async update(id: number, data: UpdateLogDto, userId: number): Promise<DailyLog | null> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (data.project_id !== undefined) {
      updates.push(`project_id = $${paramCount++}`);
      values.push(data.project_id);
    }
    if (data.date !== undefined) {
      updates.push(`date = $${paramCount++}`);
      values.push(data.date);
    }
    if (data.task_description !== undefined) {
      updates.push(`task_description = $${paramCount++}`);
      values.push(data.task_description);
    }
    if (data.actual_time_spent !== undefined) {
      updates.push(`actual_time_spent = $${paramCount++}`);
      values.push(data.actual_time_spent);
    }
    if (data.tracked_time !== undefined) {
      updates.push(`tracked_time = $${paramCount++}`);
      values.push(data.tracked_time);
    }

    if (updates.length === 0) {
      return this.findById(id);
    }

    values.push(id, userId);
    const result = await query(
      `UPDATE ${this.tableName} SET ${updates.join(', ')} WHERE id = $${paramCount} AND user_id = $${paramCount + 1} RETURNING *`,
      values
    );
    return result.rows[0] || null;
  }

  async findByUserId(userId: number, date?: string): Promise<DailyLog[]> {
    if (date) {
      const result = await query(
        `SELECT * FROM ${this.tableName} WHERE user_id = $1 AND date = $2 ORDER BY created_at DESC`,
        [userId, date]
      );
      return result.rows;
    }
    const result = await query(
      `SELECT * FROM ${this.tableName} WHERE user_id = $1 ORDER BY date DESC, created_at DESC`,
      [userId]
    );
    return result.rows;
  }

  async findByProjectId(projectId: number, date?: string): Promise<DailyLog[]> {
    if (date) {
      const result = await query(
        `SELECT * FROM ${this.tableName} WHERE project_id = $1 AND date = $2 ORDER BY created_at DESC`,
        [projectId, date]
      );
      return result.rows;
    }
    const result = await query(
      `SELECT * FROM ${this.tableName} WHERE project_id = $1 ORDER BY date DESC, created_at DESC`,
      [projectId]
    );
    return result.rows;
  }

  async findByTeamId(teamId: number, filters?: { date?: string; userId?: number; projectId?: number }): Promise<DailyLog[]> {
    let sql = `
      SELECT dl.* FROM ${this.tableName} dl
      INNER JOIN projects p ON dl.project_id = p.id
      WHERE p.team_id = $1
    `;
    const values: any[] = [teamId];
    let paramCount = 2;

    if (filters?.date) {
      sql += ` AND dl.date = $${paramCount++}`;
      values.push(filters.date);
    }
    if (filters?.userId) {
      sql += ` AND dl.user_id = $${paramCount++}`;
      values.push(filters.userId);
    }
    if (filters?.projectId) {
      sql += ` AND dl.project_id = $${paramCount++}`;
      values.push(filters.projectId);
    }

    sql += ` ORDER BY dl.date DESC, dl.created_at DESC`;

    const result = await query(sql, values);
    return result.rows;
  }

  async delete(id: number, userId: number): Promise<boolean> {
    const result = await query(
      `DELETE FROM ${this.tableName} WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );
    return result.rowCount !== null && result.rowCount > 0;
  }
}

