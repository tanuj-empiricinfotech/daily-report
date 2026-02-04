/**
 * Team Chat Routes
 *
 * API routes for the 1-to-1 team messaging feature.
 */

import { Router } from 'express';
import { TeamChatController } from '../controllers/team-chat.controller';
import { authenticate } from '../middleware/auth';
import { body, param, query } from 'express-validator';
import { handleValidationErrors } from '../middleware/validation';
import { MAX_MESSAGE_LENGTH } from '../config/jobs.config';

const router = Router();
const controller = new TeamChatController();

// All routes require authentication
router.use(authenticate);

// ============================================================================
// Conversation Routes
// ============================================================================

/**
 * GET /api/team-chat/conversations
 * List all conversations for the current user
 */
router.get('/conversations', controller.getConversations);

/**
 * POST /api/team-chat/conversations
 * Create or get a conversation with another user
 */
router.post(
  '/conversations',
  [
    body('participant_id')
      .isInt({ min: 1 })
      .withMessage('participant_id must be a positive integer'),
  ],
  handleValidationErrors,
  controller.createConversation
);

/**
 * GET /api/team-chat/conversations/:conversationId
 * Get a single conversation by ID
 */
router.get(
  '/conversations/:conversationId',
  [
    param('conversationId')
      .isInt({ min: 1 })
      .withMessage('conversationId must be a positive integer'),
  ],
  handleValidationErrors,
  controller.getConversation
);

// ============================================================================
// Message Routes
// ============================================================================

/**
 * GET /api/team-chat/conversations/:conversationId/messages
 * Get messages for a conversation with pagination
 */
router.get(
  '/conversations/:conversationId/messages',
  [
    param('conversationId')
      .isInt({ min: 1 })
      .withMessage('conversationId must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('limit must be between 1 and 100'),
    query('before')
      .optional()
      .isInt({ min: 1 })
      .withMessage('before must be a positive integer'),
  ],
  handleValidationErrors,
  controller.getMessages
);

/**
 * POST /api/team-chat/conversations/:conversationId/messages
 * Send a message in a conversation
 */
router.post(
  '/conversations/:conversationId/messages',
  [
    param('conversationId')
      .isInt({ min: 1 })
      .withMessage('conversationId must be a positive integer'),
    body('content')
      .trim()
      .notEmpty()
      .withMessage('Message content is required')
      .isLength({ max: MAX_MESSAGE_LENGTH })
      .withMessage(`Message cannot exceed ${MAX_MESSAGE_LENGTH} characters`),
  ],
  handleValidationErrors,
  controller.sendMessage
);

/**
 * DELETE /api/team-chat/messages/:messageId
 * Delete a message (sender only)
 */
router.delete(
  '/messages/:messageId',
  [
    param('messageId')
      .isInt({ min: 1 })
      .withMessage('messageId must be a positive integer'),
  ],
  handleValidationErrors,
  controller.deleteMessage
);

// ============================================================================
// Conversation Actions
// ============================================================================

/**
 * PUT /api/team-chat/conversations/:conversationId/vanishing
 * Toggle vanishing mode for a conversation
 */
router.put(
  '/conversations/:conversationId/vanishing',
  [
    param('conversationId')
      .isInt({ min: 1 })
      .withMessage('conversationId must be a positive integer'),
    body('vanishing_mode')
      .isBoolean()
      .withMessage('vanishing_mode must be a boolean'),
    body('vanishing_duration_hours')
      .optional()
      .isInt({ min: 1, max: 168 })
      .withMessage('vanishing_duration_hours must be between 1 and 168 (1 week)'),
  ],
  handleValidationErrors,
  controller.updateVanishingMode
);

/**
 * POST /api/team-chat/conversations/:conversationId/read
 * Mark messages as read
 */
router.post(
  '/conversations/:conversationId/read',
  [
    param('conversationId')
      .isInt({ min: 1 })
      .withMessage('conversationId must be a positive integer'),
    body('up_to_message_id')
      .isInt({ min: 1 })
      .withMessage('up_to_message_id must be a positive integer'),
  ],
  handleValidationErrors,
  controller.markAsRead
);

/**
 * POST /api/team-chat/conversations/:conversationId/typing
 * Send typing indicator
 */
router.post(
  '/conversations/:conversationId/typing',
  [
    param('conversationId')
      .isInt({ min: 1 })
      .withMessage('conversationId must be a positive integer'),
    body('is_typing')
      .isBoolean()
      .withMessage('is_typing must be a boolean'),
  ],
  handleValidationErrors,
  controller.sendTypingIndicator
);

// ============================================================================
// Notifications
// ============================================================================

/**
 * GET /api/team-chat/notifications/unread
 * Get unread notification count and summary
 */
router.get('/notifications/unread', controller.getUnreadNotifications);

// ============================================================================
// Real-time Events (SSE)
// ============================================================================

/**
 * GET /api/team-chat/events
 * SSE endpoint for real-time events
 */
router.get('/events', controller.subscribeToEvents);

export default router;
