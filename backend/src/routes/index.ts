import { Router } from 'express';
import authRoutes from './auth';
import teamsRoutes from './teams';
import projectsRoutes from './projects';
import assignmentsRoutes from './assignments';
import usersRoutes from './users';
import logsRoutes from './logs';

const router = Router();

router.use('/auth', authRoutes);
router.use('/teams', teamsRoutes);
router.use('/projects', projectsRoutes);
router.use('/assignments', assignmentsRoutes);
router.use('/users', usersRoutes);
router.use('/logs', logsRoutes);

export default router;

