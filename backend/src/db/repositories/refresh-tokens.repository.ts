/**
 * Refresh Tokens Repository
 * Data access layer for refresh token session management.
 */

import { BaseRepository } from './base.repository';
import { query } from '../connection';

export interface RefreshTokenRow {
  id: number;
  user_id: number;
  token_hash: string;
  device_info: string | null;
  expires_at: Date;
  created_at: Date;
}

export class RefreshTokensRepository extends BaseRepository<RefreshTokenRow> {
  protected tableName = 'refresh_tokens';

  async create(userId: number, tokenHash: string, deviceInfo: string | null, expiresAt: Date): Promise<RefreshTokenRow> {
    const result = await query(
      `INSERT INTO ${this.tableName} (user_id, token_hash, device_info, expires_at)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [userId, tokenHash, deviceInfo, expiresAt]
    );
    return result.rows[0];
  }

  async findByTokenHash(tokenHash: string): Promise<RefreshTokenRow | null> {
    const result = await query(
      `SELECT * FROM ${this.tableName} WHERE token_hash = $1 AND expires_at > CURRENT_TIMESTAMP`,
      [tokenHash]
    );
    return result.rows[0] || null;
  }

  async deleteByTokenHash(tokenHash: string): Promise<boolean> {
    const result = await query(
      `DELETE FROM ${this.tableName} WHERE token_hash = $1`,
      [tokenHash]
    );
    return (result.rowCount ?? 0) > 0;
  }

  async deleteAllByUserId(userId: number): Promise<number> {
    const result = await query(
      `DELETE FROM ${this.tableName} WHERE user_id = $1`,
      [userId]
    );
    return result.rowCount ?? 0;
  }

  async findByUserId(userId: number): Promise<RefreshTokenRow[]> {
    const result = await query(
      `SELECT * FROM ${this.tableName} WHERE user_id = $1 AND expires_at > CURRENT_TIMESTAMP ORDER BY created_at DESC`,
      [userId]
    );
    return result.rows;
  }

  async deleteExpired(): Promise<number> {
    const result = await query(
      `DELETE FROM ${this.tableName} WHERE expires_at < CURRENT_TIMESTAMP`
    );
    return result.rowCount ?? 0;
  }
}
