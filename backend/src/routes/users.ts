import { Router } from 'express';
import { UsersController } from '../controllers/users.controller';
import { authenticate, requireAdmin } from '../middleware/auth';
import { body } from 'express-validator';
import { handleValidationErrors } from '../middleware/validation';

const router = Router();
const usersController = new UsersController();

router.use(authenticate);
router.use(requireAdmin);

router.get('/', usersController.getAll);
router.get('/team/:teamId', usersController.getByTeam);
router.post(
  '/',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('role').isIn(['admin', 'member']).withMessage('Role must be admin or member'),
    body('team_id').optional().isInt().withMessage('Team ID must be a valid integer'),
  ],
  handleValidationErrors,
  usersController.create
);
router.put(
  '/:id',
  [
    body('email').optional().isEmail().withMessage('Valid email is required'),
    body('password').optional().isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('name').optional().trim().notEmpty().withMessage('Name is required'),
    body('role').optional().isIn(['admin', 'member']).withMessage('Role must be admin or member'),
    body('team_id').optional().isInt().withMessage('Team ID must be a valid integer'),
  ],
  handleValidationErrors,
  usersController.update
);
router.delete('/:id', usersController.delete);

export default router;

