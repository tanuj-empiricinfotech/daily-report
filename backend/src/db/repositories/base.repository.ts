import { query } from '../connection';

export abstract class BaseRepository<T> {
  protected abstract tableName: string;

  async findById(id: number): Promise<T | null> {
    const result = await query(
      `SELECT * FROM ${this.tableName} WHERE id = $1`,
      [id]
    );
    return result.rows[0] || null;
  }

  async findAll(): Promise<T[]> {
    const result = await query(`SELECT * FROM ${this.tableName}`);
    return result.rows;
  }

  protected async executeQuery(sql: string, params?: any[]): Promise<any> {
    return await query(sql, params);
  }
}

