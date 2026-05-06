import { FeedbackRepository } from '../db/repositories/feedback.repository';
import { CreateFeedbackDto, Feedback, FeedbackReceived, FeedbackSent } from '../types';
import { ForbiddenError, NotFoundError, ValidationError } from '../utils/errors';
import { query } from '../db/connection';

export class FeedbackService {
  private repo = new FeedbackRepository();

  async submitFeedback(
    data: CreateFeedbackDto,
    fromUserId: number,
    fromUserRole: string,
    fromUserTeamId: number | null
  ): Promise<Feedback> {
    if (data.to_user_id === fromUserId) {
      throw new ValidationError('Cannot submit feedback to yourself');
    }

    // Fetch recipient
    const recipientResult = await query(
      'SELECT id, team_id FROM users WHERE id = $1 AND is_active = TRUE',
      [data.to_user_id]
    );
    if (recipientResult.rows.length === 0) {
      throw new NotFoundError('Recipient not found');
    }
    const recipient = recipientResult.rows[0];

    // Members can only give feedback within their own team
    if (fromUserRole !== 'admin') {
      if (!fromUserTeamId || recipient.team_id !== fromUserTeamId) {
        throw new ForbiddenError('You can only give feedback to members of your own team');
      }
    }

    return this.repo.create(data, fromUserId);
  }

  async getReceived(userId: number): Promise<FeedbackReceived[]> {
    const feedback = await this.repo.findReceivedByUserId(userId);
    // Mark all as read after fetching
    await this.repo.markAllReadForUser(userId);
    return feedback;
  }

  async getSent(userId: number): Promise<FeedbackSent[]> {
    return this.repo.findSentByUserId(userId);
  }

  async getUnreadCount(userId: number): Promise<number> {
    return this.repo.countUnreadForUser(userId);
  }
}
