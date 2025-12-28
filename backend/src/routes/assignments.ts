import { Router } from 'express';
import { AssignmentsController } from '../controllers/assignments.controller';
import { authenticate, requireAdmin } from '../middleware/auth';
import { body } from 'express-validator';
import { handleValidationErrors } from '../middleware/validation';

const router = Router();
const assignmentsController = new AssignmentsController();

router.use(authenticate);
router.use(requireAdmin);

router.post(
  '/',
  [
    body('project_id').isInt({ min: 1 }).withMessage('Valid project_id is required'),
    body('user_id').isInt({ min: 1 }).withMessage('Valid user_id is required'),
    handleValidationErrors,
  ],
  assignmentsController.assign
);
router.delete(
  '/',
  [
    body('project_id').isInt({ min: 1 }).withMessage('Valid project_id is required'),
    body('user_id').isInt({ min: 1 }).withMessage('Valid user_id is required'),
    handleValidationErrors,
  ],
  assignmentsController.unassign
);
router.get('/user/:userId', assignmentsController.getUserAssignments);
router.get('/project/:projectId', assignmentsController.getProjectAssignments);

export default router;

