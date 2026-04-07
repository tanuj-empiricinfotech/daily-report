/**
 * Error Logs Repository
 * Persists unexpected server errors with the originating request snapshot
 * for post-hoc debugging.
 */

import { BaseRepository } from './base.repository';
import { query } from '../connection';

export interface ErrorLogRow {
  id: number;
  status_code: number;
  error_name: string | null;
  error_message: string;
  error_stack: string | null;
  method: string;
  path: string;
  query_params: unknown | null;
  request_body: unknown | null;
  request_headers: unknown | null;
  user_id: number | null;
  user_email: string | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: Date;
}

export interface CreateErrorLogInput {
  statusCode: number;
  errorName: string | null;
  errorMessage: string;
  errorStack: string | null;
  method: string;
  path: string;
  queryParams: unknown | null;
  requestBody: unknown | null;
  requestHeaders: unknown | null;
  userId: number | null;
  userEmail: string | null;
  ipAddress: string | null;
  userAgent: string | null;
}

export class ErrorLogsRepository extends BaseRepository<ErrorLogRow> {
  protected tableName = 'error_logs';

  async create(input: CreateErrorLogInput): Promise<ErrorLogRow> {
    const result = await query(
      `INSERT INTO ${this.tableName} (
        status_code, error_name, error_message, error_stack,
        method, path, query_params, request_body, request_headers,
        user_id, user_email, ip_address, user_agent
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *`,
      [
        input.statusCode,
        input.errorName,
        input.errorMessage,
        input.errorStack,
        input.method,
        input.path,
        input.queryParams ? JSON.stringify(input.queryParams) : null,
        input.requestBody ? JSON.stringify(input.requestBody) : null,
        input.requestHeaders ? JSON.stringify(input.requestHeaders) : null,
        input.userId,
        input.userEmail,
        input.ipAddress,
        input.userAgent,
      ]
    );
    return result.rows[0];
  }

  async findRecent(limit: number, offset: number): Promise<ErrorLogRow[]> {
    const result = await query(
      `SELECT * FROM ${this.tableName} ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    return result.rows;
  }

  async count(): Promise<number> {
    const result = await query(`SELECT COUNT(*)::int AS count FROM ${this.tableName}`);
    return result.rows[0]?.count ?? 0;
  }

  async deleteOlderThan(days: number): Promise<number> {
    const result = await query(
      `DELETE FROM ${this.tableName} WHERE created_at < CURRENT_TIMESTAMP - ($1 || ' days')::interval`,
      [days]
    );
    return result.rowCount ?? 0;
  }
}
