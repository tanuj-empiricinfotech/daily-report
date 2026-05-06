import { query } from '../connection';
import { Feedback, FeedbackReceived, FeedbackSent, CreateFeedbackDto } from '../../types';

export class FeedbackRepository {
  async create(data: CreateFeedbackDto, fromUserId: number): Promise<Feedback> {
    const result = await query(
      `INSERT INTO feedback (from_user_id, to_user_id, content, rating)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [fromUserId, data.to_user_id, data.content, data.rating ?? null]
    );
    return result.rows[0];
  }

  // Strips from_user_id — safe to return to recipient
  async findReceivedByUserId(userId: number): Promise<FeedbackReceived[]> {
    const result = await query(
      `SELECT id, content, rating, is_read, created_at
       FROM feedback
       WHERE to_user_id = $1
       ORDER BY created_at DESC`,
      [userId]
    );
    return result.rows;
  }

  async findSentByUserId(userId: number): Promise<FeedbackSent[]> {
    const result = await query(
      `SELECT id, to_user_id, content, rating, created_at
       FROM feedback
       WHERE from_user_id = $1
       ORDER BY created_at DESC`,
      [userId]
    );
    return result.rows;
  }

  async markAllReadForUser(userId: number): Promise<void> {
    await query(
      `UPDATE feedback SET is_read = TRUE WHERE to_user_id = $1 AND is_read = FALSE`,
      [userId]
    );
  }

  async countUnreadForUser(userId: number): Promise<number> {
    const result = await query(
      `SELECT COUNT(*) FROM feedback WHERE to_user_id = $1 AND is_read = FALSE`,
      [userId]
    );
    return parseInt(result.rows[0].count, 10);
  }

  // Used by monthly recap service — returns full rows including from_user_id
  async findAllReceivedByUserIdForRecap(userId: number, fromDate?: Date, toDate?: Date): Promise<Feedback[]> {
    let sql = `SELECT * FROM feedback WHERE to_user_id = $1`;
    const values: any[] = [userId];
    let paramCount = 2;

    if (fromDate) {
      sql += ` AND created_at >= $${paramCount++}`;
      values.push(fromDate);
    }
    if (toDate) {
      sql += ` AND created_at <= $${paramCount++}`;
      values.push(toDate);
    }
    sql += ' ORDER BY created_at DESC';

    const result = await query(sql, values);
    return result.rows;
  }
}
