import { BaseRepository } from './base.repository';
import { ProjectAssignment } from '../../types';
import { query } from '../connection';

export class AssignmentsRepository extends BaseRepository<ProjectAssignment> {
  protected tableName = 'project_assignments';

  async create(projectId: number, userId: number): Promise<ProjectAssignment> {
    const result = await query(
      `INSERT INTO ${this.tableName} (project_id, user_id)
       VALUES ($1, $2)
       ON CONFLICT (project_id, user_id) DO NOTHING
       RETURNING *`,
      [projectId, userId]
    );
    return result.rows[0];
  }

  async findByUserId(userId: number): Promise<ProjectAssignment[]> {
    const result = await query(
      `SELECT * FROM ${this.tableName} WHERE user_id = $1`,
      [userId]
    );
    return result.rows;
  }

  async findByProjectId(projectId: number): Promise<ProjectAssignment[]> {
    const result = await query(
      `SELECT * FROM ${this.tableName} WHERE project_id = $1`,
      [projectId]
    );
    return result.rows;
  }

  async delete(projectId: number, userId: number): Promise<boolean> {
    const result = await query(
      `DELETE FROM ${this.tableName} WHERE project_id = $1 AND user_id = $2`,
      [projectId, userId]
    );
    return result.rowCount !== null && result.rowCount > 0;
  }

  async isUserAssignedToProject(userId: number, projectId: number): Promise<boolean> {
    const result = await query(
      `SELECT 1 FROM ${this.tableName} WHERE user_id = $1 AND project_id = $2 LIMIT 1`,
      [userId, projectId]
    );
    return result.rows.length > 0;
  }
}

