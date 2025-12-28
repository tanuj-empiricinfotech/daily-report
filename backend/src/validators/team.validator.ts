import { body } from 'express-validator';

export const createTeamValidator = [
  body('name').trim().notEmpty().withMessage('Team name is required'),
  body('description').optional().isString(),
];

export const updateTeamValidator = [
  body('name').optional().trim().notEmpty().withMessage('Team name cannot be empty'),
  body('description').optional().isString(),
];

