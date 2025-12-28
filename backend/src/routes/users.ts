import { Router } from 'express';
import { UsersController } from '../controllers/users.controller';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();
const usersController = new UsersController();

router.use(authenticate);
router.use(requireAdmin);

router.get('/', usersController.getAll);
router.get('/team/:teamId', usersController.getByTeam);

export default router;

