import { body } from 'express-validator';

export const createLogValidator = [
  body('project_id').isInt({ min: 1 }).withMessage('Valid project_id is required'),
  body('date').isISO8601().withMessage('Valid date is required'),
  body('task_description').trim().notEmpty().withMessage('Task description is required'),
  body('actual_time_spent')
    .isFloat({ min: 0 })
    .withMessage('Actual time spent must be a positive number'),
  body('tracked_time')
    .isFloat({ min: 0 })
    .withMessage('Tracked time must be a positive number'),
];

export const updateLogValidator = [
  body('project_id').optional().isInt({ min: 1 }).withMessage('Valid project_id is required'),
  body('date').optional().isISO8601().withMessage('Valid date is required'),
  body('task_description').optional().trim().notEmpty().withMessage('Task description cannot be empty'),
  body('actual_time_spent')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Actual time spent must be a positive number'),
  body('tracked_time')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Tracked time must be a positive number'),
];

