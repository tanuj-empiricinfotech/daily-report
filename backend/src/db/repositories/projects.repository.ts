import { BaseRepository } from './base.repository';
import { Project, ProjectWithProgress, CreateProjectDto, UpdateProjectDto } from '../../types';
import { query, getClient } from '../connection';

const TRACKED_TIME_TO_HOURS_SQL = `(
  SPLIT_PART(dl.tracked_time, ':', 1)::numeric +
  SPLIT_PART(dl.tracked_time, ':', 2)::numeric / 60.0
)`;

// Correlated subquery returns all team_ids for each project regardless of any outer filter
const TEAM_IDS_SUBQUERY = `(
  SELECT COALESCE(json_agg(pt.team_id ORDER BY pt.team_id), '[]'::json)
  FROM project_teams pt
  WHERE pt.project_id = p.id
)`;

const PROJECT_PROGRESS_COLS = `
  p.*,
  COALESCE(SUM(${TRACKED_TIME_TO_HOURS_SQL}), 0)::float AS tracked_hours_total,
  ${TEAM_IDS_SUBQUERY} AS team_ids
`;

function normalizeProjectRow(row: any): ProjectWithProgress {
  return {
    ...row,
    team_ids: Array.isArray(row.team_ids) ? row.team_ids : [],
    estimated_hours: row.estimated_hours === null ? null : Number(row.estimated_hours),
    tracked_hours_total: Number(row.tracked_hours_total ?? 0),
  };
}

export class ProjectsRepository extends BaseRepository<Project> {
  protected tableName = 'projects';

  async create(data: CreateProjectDto, createdBy: number): Promise<ProjectWithProgress> {
    const client = await getClient();
    try {
      await client.query('BEGIN');

      const result = await client.query(
        `INSERT INTO ${this.tableName}
           (name, description, created_by, estimated_hours, progress_tracking_enabled)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [
          data.name,
          data.description || null,
          createdBy,
          data.estimated_hours ?? null,
          data.progress_tracking_enabled ?? false,
        ]
      );
      const project = result.rows[0];

      if (data.team_ids && data.team_ids.length > 0) {
        const placeholders = data.team_ids.map((_, i) => `($1, $${i + 2})`).join(', ');
        await client.query(
          `INSERT INTO project_teams (project_id, team_id) VALUES ${placeholders}`,
          [project.id, ...data.team_ids]
        );
      }

      await client.query('COMMIT');
      return normalizeProjectRow({ ...project, team_ids: data.team_ids ?? [], tracked_hours_total: 0 });
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  async update(id: number, data: UpdateProjectDto): Promise<ProjectWithProgress | null> {
    const client = await getClient();
    try {
      await client.query('BEGIN');

      // Update scalar fields
      const updates: string[] = [];
      const values: any[] = [];
      let paramCount = 1;

      if (data.name !== undefined) { updates.push(`name = $${paramCount++}`); values.push(data.name); }
      if (data.description !== undefined) { updates.push(`description = $${paramCount++}`); values.push(data.description); }
      if (data.estimated_hours !== undefined) { updates.push(`estimated_hours = $${paramCount++}`); values.push(data.estimated_hours); }
      if (data.progress_tracking_enabled !== undefined) { updates.push(`progress_tracking_enabled = $${paramCount++}`); values.push(data.progress_tracking_enabled); }

      if (updates.length > 0) {
        values.push(id);
        await client.query(
          `UPDATE ${this.tableName} SET ${updates.join(', ')} WHERE id = $${paramCount}`,
          values
        );
      }

      // Replace team associations if provided
      if (data.team_ids !== undefined) {
        await client.query('DELETE FROM project_teams WHERE project_id = $1', [id]);
        if (data.team_ids.length > 0) {
          const placeholders = data.team_ids.map((_, i) => `($1, $${i + 2})`).join(', ');
          await client.query(
            `INSERT INTO project_teams (project_id, team_id) VALUES ${placeholders}`,
            [id, ...data.team_ids]
          );
        }
      }

      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }

    return this.findByIdWithProgress(id);
  }

  async findByIdWithProgress(id: number): Promise<ProjectWithProgress | null> {
    const result = await query(
      `SELECT ${PROJECT_PROGRESS_COLS}
       FROM ${this.tableName} p
       LEFT JOIN daily_logs dl ON dl.project_id = p.id
       WHERE p.id = $1
       GROUP BY p.id`,
      [id]
    );
    return result.rows[0] ? normalizeProjectRow(result.rows[0]) : null;
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
    const result = await query(
      `SELECT ${PROJECT_PROGRESS_COLS}
       FROM ${this.tableName} p
       LEFT JOIN daily_logs dl ON dl.project_id = p.id
       GROUP BY p.id`
    );
    return result.rows.map(normalizeProjectRow);
  }

  async findByTeamIdWithProgress(teamId: number): Promise<ProjectWithProgress[]> {
    const result = await query(
      `SELECT ${PROJECT_PROGRESS_COLS}
       FROM ${this.tableName} p
       LEFT JOIN daily_logs dl ON dl.project_id = p.id
       WHERE EXISTS (
         SELECT 1 FROM project_teams pt WHERE pt.project_id = p.id AND pt.team_id = $1
       )
       GROUP BY p.id`,
      [teamId]
    );
    return result.rows.map(normalizeProjectRow);
  }

  async findByUserIdWithProgress(userId: number): Promise<ProjectWithProgress[]> {
    const result = await query(
      `SELECT ${PROJECT_PROGRESS_COLS}
       FROM ${this.tableName} p
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
      `SELECT ${PROJECT_PROGRESS_COLS}
       FROM ${this.tableName} p
       LEFT JOIN project_assignments pa ON pa.project_id = p.id
       LEFT JOIN daily_logs dl ON dl.project_id = p.id
       WHERE EXISTS (
         SELECT 1 FROM project_teams pt WHERE pt.project_id = p.id AND pt.team_id = $1
       ) OR pa.user_id = $2
       GROUP BY p.id`,
      [teamId, userId]
    );
    return result.rows.map(normalizeProjectRow);
  }

  async findByTeamId(teamId: number): Promise<Project[]> {
    const result = await query(
      `SELECT p.*, ${TEAM_IDS_SUBQUERY} AS team_ids
       FROM ${this.tableName} p
       WHERE EXISTS (
         SELECT 1 FROM project_teams pt WHERE pt.project_id = p.id AND pt.team_id = $1
       )`,
      [teamId]
    );
    return result.rows.map((row) => ({ ...row, team_ids: Array.isArray(row.team_ids) ? row.team_ids : [] }));
  }

  async delete(id: number): Promise<boolean> {
    const result = await query(
      `DELETE FROM ${this.tableName} WHERE id = $1`,
      [id]
    );
    return result.rowCount !== null && result.rowCount > 0;
  }
}
