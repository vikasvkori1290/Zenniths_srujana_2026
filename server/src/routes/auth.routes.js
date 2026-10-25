import express from 'express';
import { register, login, demoLogin, getMe, updatePassword, forgotPassword } from '../controllers/auth.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/demo', demoLogin);
router.get('/me', requireAuth, getMe);
router.post('/update-password', requireAuth, updatePassword);
router.post('/forgot-password', forgotPassword);

export default router;
