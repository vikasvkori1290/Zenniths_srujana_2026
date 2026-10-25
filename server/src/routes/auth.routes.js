import express from 'express';
import {
  register,
  login,
  demoLogin,
  getMe,
  updatePassword,
  forgotPassword,
  sendForgotPasswordOtp,
  verifyForgotPasswordOtp,
  resetPasswordWithOtp,
  sendRegisterOtp,
  verifyRegisterOtp,
} from '../controllers/auth.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/register', register);
router.post('/register/send-otp', sendRegisterOtp);
router.post('/register/verify-otp', verifyRegisterOtp);

router.post('/login', login);
router.post('/demo', demoLogin);
router.get('/me', requireAuth, getMe);
router.post('/update-password', requireAuth, updatePassword);

// Password Reset with OTP verification
router.post('/forgot-password', forgotPassword); // Legacy fallback
router.post('/forgot-password/send-otp', sendForgotPasswordOtp);
router.post('/forgot-password/verify-otp', verifyForgotPasswordOtp);
router.post('/forgot-password/reset', resetPasswordWithOtp);

export default router;
