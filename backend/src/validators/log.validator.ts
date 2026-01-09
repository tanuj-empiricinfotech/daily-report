import { body } from 'express-validator';
import { isValidTimeFormat } from '../utils/time.util';

const TIME_FORMAT_REGEX = /^\d+:[0-5]\d$/;

/**
 * Custom validator for time format (HH:MM)
 * Accepts empty string as valid (represents 0)
 */
const validateTimeFormat = (value: string) => {
  // Allow empty string (represents 0:00)
  if (value === '' || value === null || value === undefined) {
    return true;
  }

  if (typeof value !== 'string') {
    throw new Error('Time must be a string in HH:MM format (e.g., "3:30")');
  }

  if (!isValidTimeFormat(value)) {
    throw new Error('Time must be in HH:MM format (e.g., "3:30", "0:45", "12:15"). Leave empty for 0 hours.');
  }

  return true;
};

export const createLogValidator = [
  body('user_id').optional().isInt({ min: 1 }).withMessage('user_id must be a positive integer'),
  body('project_id').isInt({ min: 1 }).withMessage('Valid project_id is required'),
  body('date').isISO8601().withMessage('Valid date is required'),
  body('task_description').trim().notEmpty().withMessage('Task description is required'),
  body('actual_time_spent')
    .custom(validateTimeFormat)
    .withMessage('Actual time spent must be in HH:MM format (e.g., "3:30") or empty for 0'),
  body('tracked_time')
    .custom(validateTimeFormat)
    .withMessage('Tracked time must be in HH:MM format (e.g., "3:30") or empty for 0'),
];

export const updateLogValidator = [
  body('project_id').optional().isInt({ min: 1 }).withMessage('Valid project_id is required'),
  body('date').optional().isISO8601().withMessage('Valid date is required'),
  body('task_description').optional().trim().notEmpty().withMessage('Task description cannot be empty'),
  body('actual_time_spent')
    .optional()
    .custom(validateTimeFormat)
    .withMessage('Actual time spent must be in HH:MM format (e.g., "3:30") or empty for 0'),
  body('tracked_time')
    .optional()
    .custom(validateTimeFormat)
    .withMessage('Tracked time must be in HH:MM format (e.g., "3:30") or empty for 0'),
];

export const createLogsBulkValidator = [
  body()
    .isArray({ min: 1 })
    .withMessage('Request body must be an array with at least one log entry'),
  body('*.user_id').optional().isInt({ min: 1 }).withMessage('user_id must be a positive integer'),
  body('*.project_id').isInt({ min: 1 }).withMessage('Valid project_id is required for each entry'),
  body('*.date').isISO8601().withMessage('Valid date is required for each entry'),
  body('*.task_description')
    .trim()
    .notEmpty()
    .withMessage('Task description is required for each entry'),
  body('*.actual_time_spent')
    .custom(validateTimeFormat)
    .withMessage('Actual time spent must be in HH:MM format (e.g., "3:30") or empty for 0 for each entry'),
  body('*.tracked_time')
    .custom(validateTimeFormat)
    .withMessage('Tracked time must be in HH:MM format (e.g., "3:30") or empty for 0 for each entry'),
];

