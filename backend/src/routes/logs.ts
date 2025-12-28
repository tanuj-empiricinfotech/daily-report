import { Router } from 'express';
import { LogsController } from '../controllers/logs.controller';
import { authenticate, requireAdmin } from '../middleware/auth';
import { createLogValidator, updateLogValidator } from '../validators/log.validator';
import { handleValidationErrors } from '../middleware/validation';

const router = Router();
const logsController = new LogsController();

router.use(authenticate);

router.post('/', createLogValidator, handleValidationErrors, logsController.create);
router.get('/my', logsController.getMyLogs);
router.get('/team/:teamId', requireAdmin, logsController.getTeamLogs);
router.get('/:id', logsController.getById);
router.put('/:id', updateLogValidator, handleValidationErrors, logsController.update);
router.delete('/:id', logsController.delete);

export default router;

