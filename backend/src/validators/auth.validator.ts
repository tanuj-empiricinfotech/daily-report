import { body } from 'express-validator';
import { PASSWORD_CONFIG, PASSWORD_ERROR_MESSAGES } from '../config/password.config';

export const registerValidator = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('role').isIn(['admin', 'member']).withMessage('Role must be admin or member'),
];

export const loginValidator = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

export const changePasswordValidator = [
  body('currentPassword')
    .notEmpty()
    .withMessage(PASSWORD_ERROR_MESSAGES.REQUIRED),
  body('newPassword')
    .notEmpty()
    .withMessage(PASSWORD_ERROR_MESSAGES.REQUIRED)
    .isLength({ min: PASSWORD_CONFIG.MIN_LENGTH })
    .withMessage(PASSWORD_ERROR_MESSAGES.TOO_SHORT),
];

