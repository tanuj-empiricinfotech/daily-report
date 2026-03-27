import { BaseRepository } from './base.repository';
import { MonthlyRecap, RecapSlide } from '../../types';
import { query } from '../connection';

export class MonthlyRecapRepository extends BaseRepository<MonthlyRecap> {
  protected tableName = 'monthly_recaps';

  async findByUserAndMonth(userId: number, month: number, year: number): Promise<MonthlyRecap | null> {
    const result = await query(
      `SELECT * FROM ${this.tableName} WHERE user_id = $1 AND month = $2 AND year = $3`,
      [userId, month, year]
    );
    return result.rows[0] || null;
  }

  async upsert(userId: number, month: number, year: number, slidesData: RecapSlide[], isPartial: boolean): Promise<MonthlyRecap> {
    const result = await query(
      `INSERT INTO ${this.tableName} (user_id, month, year, slides_data, is_partial)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id, month, year) DO UPDATE SET
         slides_data = EXCLUDED.slides_data,
         is_partial = EXCLUDED.is_partial,
         generated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [userId, month, year, JSON.stringify(slidesData), isPartial]
    );
    return result.rows[0];
  }

  async updateLastViewedSlide(id: number, slideIndex: number): Promise<void> {
    await query(
      `UPDATE ${this.tableName} SET last_viewed_slide = $1 WHERE id = $2`,
      [slideIndex, id]
    );
  }

  async findAvailableRecaps(userId: number): Promise<Array<{ month: number; year: number }>> {
    const result = await query(
      `SELECT month, year FROM ${this.tableName} WHERE user_id = $1 ORDER BY year DESC, month DESC`,
      [userId]
    );
    return result.rows;
  }
}
