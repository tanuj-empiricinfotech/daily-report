import { body } from 'express-validator';

export const createProjectValidator = [
  body('team_ids')
    .isArray({ min: 1 })
    .withMessage('At least one team_id is required'),
  body('team_ids.*')
    .isInt({ min: 1 })
    .withMessage('Each team_id must be a positive integer'),
  body('name').trim().notEmpty().withMessage('Project name is required'),
  body('description').optional().isString(),
  body('estimated_hours')
    .optional({ nullable: true })
    .isFloat({ min: 0 })
    .withMessage('estimated_hours must be a non-negative number'),
  body('progress_tracking_enabled')
    .optional()
    .isBoolean()
    .withMessage('progress_tracking_enabled must be a boolean'),
];

export const updateProjectValidator = [
  body('name').optional().trim().notEmpty().withMessage('Project name cannot be empty'),
  body('description').optional({ nullable: true }).isString(),
  body('team_ids')
    .optional()
    .isArray({ min: 1 })
    .withMessage('team_ids must be a non-empty array'),
  body('team_ids.*')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Each team_id must be a positive integer'),
  body('estimated_hours')
    .optional({ nullable: true })
    .isFloat({ min: 0 })
    .withMessage('estimated_hours must be a non-negative number'),
  body('progress_tracking_enabled')
    .optional()
    .isBoolean()
    .withMessage('progress_tracking_enabled must be a boolean'),
];
