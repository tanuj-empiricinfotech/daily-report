import { Router } from 'express';
import { FeedbackController } from '../controllers/feedback.controller';
import { authenticate } from '../middleware/auth';
import { createFeedbackValidator } from '../validators/feedback.validator';
import { handleValidationErrors } from '../middleware/validation';

const router = Router();
const controller = new FeedbackController();

router.use(authenticate);

router.post('/', createFeedbackValidator, handleValidationErrors, controller.submit);
router.get('/received', controller.getReceived);
router.get('/sent', controller.getSent);
router.get('/unread-count', controller.getUnreadCount);

export default router;
