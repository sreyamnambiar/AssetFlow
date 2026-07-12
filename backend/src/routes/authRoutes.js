import { Router } from 'express';
import { forgotPassword, getMe, login, signup } from '../controllers/authController.js';
import { requireAuth } from '../middlewares/authMiddleware.js';
import {
  validateForgotPassword,
  validateLogin,
  validateSignup,
} from '../validators/authValidator.js';

const router = Router();

router.post('/signup', validateSignup, signup);
router.post('/login', validateLogin, login);
router.post('/forgot-password', validateForgotPassword, forgotPassword);
router.get('/me', requireAuth, getMe);

export default router;
