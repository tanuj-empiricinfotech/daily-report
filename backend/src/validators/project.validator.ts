import { body } from 'express-validator';

export const createProjectValidator = [
  body('team_id').isInt({ min: 1 }).withMessage('Valid team_id is required'),
  body('name').trim().notEmpty().withMessage('Project name is required'),
  body('description').optional().isString(),
];

export const updateProjectValidator = [
  body('name').optional().trim().notEmpty().withMessage('Project name cannot be empty'),
  body('description').optional().isString(),
];

