/**
 * Recaps Routes
 *
 * API routes for monthly recap functionality
 */

import { Router } from 'express';
import { MonthlyRecapController } from '../controllers/monthly-recap.controller';
import { authenticate } from '../middleware/auth';

const router = Router();
const controller = new MonthlyRecapController();

// All recap routes require authentication
router.use(authenticate);

// GET /api/recaps/available - Get available months
router.get('/available', controller.getAvailableMonths);

// GET /api/recaps/:year/:month - Get or generate recap
router.get('/:year/:month', controller.getRecap);

// PATCH /api/recaps/:id/progress - Update viewing progress
router.patch('/:id/progress', controller.updateProgress);

export default router;
