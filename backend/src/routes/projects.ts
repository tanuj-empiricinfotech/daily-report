import { Router } from 'express';
import { ProjectsController } from '../controllers/projects.controller';
import { authenticate, requireAdmin } from '../middleware/auth';
import { createProjectValidator, updateProjectValidator } from '../validators/project.validator';
import { handleValidationErrors } from '../middleware/validation';

const router = Router();
const projectsController = new ProjectsController();

router.use(authenticate);

// Write operations require admin
router.post('/', requireAdmin, createProjectValidator, handleValidationErrors, projectsController.create);
router.put('/:id', requireAdmin, updateProjectValidator, handleValidationErrors, projectsController.update);
router.delete('/:id', requireAdmin, projectsController.delete);

// Read operations are available to all authenticated users
router.get('/my', projectsController.getMyProjects);
router.get('/team/:teamId', projectsController.getByTeam);
router.get('/', projectsController.getAll);
router.get('/:id', projectsController.getById);

export default router;

