import { BaseRepository } from './base.repository';
import { Team, CreateTeamDto } from '../../types';
import { query } from '../connection';

export class TeamsRepository extends BaseRepository<Team> {
  protected tableName = 'teams';

  async create(data: CreateTeamDto, createdBy: number): Promise<Team> {
    const result = await query(
      `INSERT INTO ${this.tableName} (name, description, webhook_url, created_by)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [data.name, data.description || null, data.webhook_url || null, createdBy]
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
    if (data.webhook_url !== undefined) {
      updates.push(`webhook_url = $${paramCount++}`);
      values.push(data.webhook_url);
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

  async delete(id: number): Promise<boolean> {
    const result = await query(
      `DELETE FROM ${this.tableName} WHERE id = $1`,
      [id]
    );
    return result.rowCount !== null && result.rowCount > 0;
  }

  /**
   * Update the webhook URL for a team
   *
   * @param id - Team ID
   * @param webhookUrl - Microsoft Teams webhook URL (or null to remove)
   * @returns Updated team or null if not found
   */
  async updateWebhookUrl(id: number, webhookUrl: string | null): Promise<Team | null> {
    const result = await query(
      `UPDATE ${this.tableName} SET webhook_url = $1 WHERE id = $2 RETURNING *`,
      [webhookUrl, id]
    );
    return result.rows[0] || null;
  }

  /**
   * Get all teams that have webhook URLs configured
   *
   * @returns Array of teams with webhook URLs
   */
  async findAllWithWebhooks(): Promise<Team[]> {
    const result = await query(
      `SELECT * FROM ${this.tableName} WHERE webhook_url IS NOT NULL AND webhook_url != ''`
    );
    return result.rows;
  }
}

