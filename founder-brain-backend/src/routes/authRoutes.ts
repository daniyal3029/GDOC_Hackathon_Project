import { Router } from 'express';
import { container } from '../config/container';
import { authenticate } from '../middleware/auth';
import { validatePassword } from '../utils/passwordValidator';

const router = Router();
const authController = container.getAuthController();

// Helper for basic validation
const validateRegister = (req: any, res: any, next: any) => {
  const { email, password, name } = req.body;
  if (!email || !password || !name) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }
  const passwordCheck = validatePassword(password);
  if (!passwordCheck.valid) {
    return res.status(400).json({ success: false, message: passwordCheck.errors.join('. ') });
  }
  next();
};

router.post('/register', validateRegister, authController.register);
router.post('/verify-signup', authController.verifySignup);
router.post('/login', authController.login);
router.post('/logout', authenticate, authController.logout);
router.post('/refresh', authController.refresh);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);
router.get('/me', authenticate, authController.getMe);

export default router;
