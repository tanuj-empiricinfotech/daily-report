/**
 * Chat Routes
 *
 * API routes for AI-powered chat functionality
 */

import { Router } from 'express';
import { ChatController } from '../controllers/chat.controller';
import { authenticate } from '../middleware/auth';

const router = Router();
const chatController = new ChatController();

// All chat routes require authentication
router.use(authenticate);

// POST /api/chat - Send chat message and stream response
router.post('/', chatController.chat);

// GET /api/chat/context - Get chat context metadata
router.get('/context', chatController.getContext);

export default router;
