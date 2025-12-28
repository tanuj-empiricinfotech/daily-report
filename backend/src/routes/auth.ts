import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { registerValidator, loginValidator } from '../validators/auth.validator';
import { handleValidationErrors } from '../middleware/validation';

const router = Router();
const authController = new AuthController();

router.post('/register', registerValidator, handleValidationErrors, authController.register);
router.post('/login', loginValidator, handleValidationErrors, authController.login);
router.post('/logout', authController.logout);

export default router;

