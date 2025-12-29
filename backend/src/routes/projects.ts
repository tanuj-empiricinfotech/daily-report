import { Router } from 'express';
import { ProjectsController } from '../controllers/projects.controller';
import { authenticate, requireAdmin } from '../middleware/auth';
import { createProjectValidator, updateProjectValidator } from '../validators/project.validator';
import { handleValidationErrors } from '../middleware/validation';

const router = Router();
const projectsController = new ProjectsController();

router.use(authenticate);
router.use(requireAdmin);

router.post('/', createProjectValidator, handleValidationErrors, projectsController.create);
router.get('/', projectsController.getAll);
router.get('/team/:teamId', projectsController.getByTeam);
router.get('/:id', projectsController.getById);
router.put('/:id', updateProjectValidator, handleValidationErrors, projectsController.update);
router.delete('/:id', projectsController.delete);

export default router;

