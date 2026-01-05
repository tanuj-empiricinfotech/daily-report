import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { registerValidator, loginValidator, changePasswordValidator } from '../validators/auth.validator';
import { handleValidationErrors } from '../middleware/validation';
import { authenticate } from '../middleware/auth';
import { passwordChangeRateLimiter } from '../middleware/rateLimiter';

const router = Router();
const authController = new AuthController();

router.post('/register', registerValidator, handleValidationErrors, authController.register);
router.post('/login', loginValidator, handleValidationErrors, authController.login);
router.post('/logout', authController.logout);
router.put(
  '/password',
  authenticate,
  passwordChangeRateLimiter,
  changePasswordValidator,
  handleValidationErrors,
  authController.changePassword
);

export default router;

