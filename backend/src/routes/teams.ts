import { Router } from 'express';
import { TeamsController } from '../controllers/teams.controller';
import { authenticate, requireAdmin } from '../middleware/auth';
import { createTeamValidator, updateTeamValidator } from '../validators/team.validator';
import { handleValidationErrors } from '../middleware/validation';

const router = Router();
const teamsController = new TeamsController();

router.use(authenticate);
router.use(requireAdmin);

router.post('/', createTeamValidator, handleValidationErrors, teamsController.create);
router.get('/', teamsController.getAll);
router.get('/:id', teamsController.getById);
router.put('/:id', updateTeamValidator, handleValidationErrors, teamsController.update);
router.delete('/:id', teamsController.delete);

export default router;

