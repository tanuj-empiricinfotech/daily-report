import { BaseRepository } from './base.repository';
import { Project, ProjectWithProgress, CreateProjectDto, UpdateProjectDto } from '../../types';
import { query } from '../connection';

/**
 * SQL fragment that converts a daily_logs.tracked_time value (stored as the
 * VARCHAR "HH:MM" format defined by migration 003) into decimal hours.
 * Used inside SUM() to aggregate tracked time per project.
 */
const TRACKED_TIME_TO_HOURS_SQL = `(
  SPLIT_PART(dl.tracked_time, ':', 1)::numeric +
  SPLIT_PART(dl.tracked_time, ':', 2)::numeric / 60.0
)`;

/**
 * Selects every column from the projects table plus a `tracked_hours_total`
 * column computed by summing tracked_time across daily_logs joined on
 * project_id. The LEFT JOIN ensures projects with no logs report 0.
 */
const PROJECT_WITH_PROGRESS_SELECT = `
  SELECT
    p.*,
    COALESCE(SUM(${TRACKED_TIME_TO_HOURS_SQL}), 0)::float AS tracked_hours_total
  FROM projects p
  LEFT JOIN daily_logs dl ON dl.project_id = p.id
`;

/**
 * Normalizes a row coming back from PostgreSQL — pg returns DECIMAL columns
 * as strings, but the API contract is `number | null`.
 */
function normalizeProjectRow(row: any): ProjectWithProgress {
  return {
    ...row,
    estimated_hours: row.estimated_hours === null ? null : Number(row.estimated_hours),
    tracked_hours_total: Number(row.tracked_hours_total ?? 0),
  };
}

export class ProjectsRepository extends BaseRepository<Project> {
  protected tableName = 'projects';

  async create(data: CreateProjectDto, createdBy: number): Promise<Project> {
    const result = await query(
      `INSERT INTO ${this.tableName}
         (team_id, name, description, created_by, estimated_hours, progress_tracking_enabled)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        data.team_id,
        data.name,
        data.description || null,
        createdBy,
        data.estimated_hours ?? null,
        data.progress_tracking_enabled ?? false,
      ]
    );
    return result.rows[0];
  }

  async update(id: number, data: UpdateProjectDto): Promise<Project | null> {
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
    if (data.estimated_hours !== undefined) {
      updates.push(`estimated_hours = $${paramCount++}`);
      values.push(data.estimated_hours);
    }
    if (data.progress_tracking_enabled !== undefined) {
      updates.push(`progress_tracking_enabled = $${paramCount++}`);
      values.push(data.progress_tracking_enabled);
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

  async findByIds(ids: number[]): Promise<Project[]> {
    if (ids.length === 0) return [];
    const result = await query(
      `SELECT * FROM ${this.tableName} WHERE id = ANY($1)`,
      [ids]
    );
    return result.rows;
  }

  async findAllWithProgress(): Promise<ProjectWithProgress[]> {
    const result = await query(`${PROJECT_WITH_PROGRESS_SELECT} GROUP BY p.id`);
    return result.rows.map(normalizeProjectRow);
  }

  async findByTeamIdWithProgress(teamId: number): Promise<ProjectWithProgress[]> {
    const result = await query(
      `${PROJECT_WITH_PROGRESS_SELECT} WHERE p.team_id = $1 GROUP BY p.id`,
      [teamId]
    );
    return result.rows.map(normalizeProjectRow);
  }

  async findByUserIdWithProgress(userId: number): Promise<ProjectWithProgress[]> {
    const result = await query(
      `SELECT
         p.*,
         COALESCE(SUM(${TRACKED_TIME_TO_HOURS_SQL}), 0)::float AS tracked_hours_total
       FROM projects p
       INNER JOIN project_assignments pa ON pa.project_id = p.id
       LEFT JOIN daily_logs dl ON dl.project_id = p.id
       WHERE pa.user_id = $1
       GROUP BY p.id`,
      [userId]
    );
    return result.rows.map(normalizeProjectRow);
  }

  async findByTeamIdOrUserIdWithProgress(
    teamId: number | null,
    userId: number
  ): Promise<ProjectWithProgress[]> {
    if (teamId === null) {
      return this.findByUserIdWithProgress(userId);
    }
    const result = await query(
      `SELECT
         p.*,
         COALESCE(SUM(${TRACKED_TIME_TO_HOURS_SQL}), 0)::float AS tracked_hours_total
       FROM projects p
       LEFT JOIN project_assignments pa ON pa.project_id = p.id
       LEFT JOIN daily_logs dl ON dl.project_id = p.id
       WHERE p.team_id = $1 OR pa.user_id = $2
       GROUP BY p.id`,
      [teamId, userId]
    );
    return result.rows.map(normalizeProjectRow);
  }

  async findByTeamId(teamId: number): Promise<Project[]> {
    const result = await query(
      `SELECT * FROM ${this.tableName} WHERE team_id = $1`,
      [teamId]
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
}
