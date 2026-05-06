import { body } from 'express-validator';

export const createFeedbackValidator = [
  body('to_user_id').isInt({ min: 1 }).withMessage('Valid recipient is required'),
  body('content').trim().notEmpty().withMessage('Feedback content is required'),
  body('rating')
    .optional({ nullable: true })
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
];
