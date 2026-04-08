import { body } from 'express-validator';

export const createProjectValidator = [
  body('team_id').isInt({ min: 1 }).withMessage('Valid team_id is required'),
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
  body('estimated_hours')
    .optional({ nullable: true })
    .isFloat({ min: 0 })
    .withMessage('estimated_hours must be a non-negative number'),
  body('progress_tracking_enabled')
    .optional()
    .isBoolean()
    .withMessage('progress_tracking_enabled must be a boolean'),
];
