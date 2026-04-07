import { Router } from 'express';
import { ErrorLogsController } from '../controllers/error-logs.controller';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();
const controller = new ErrorLogsController();

router.use(authenticate);
router.use(requireAdmin);

router.get('/', controller.list);
router.get('/:id', controller.getById);

export default router;
