import express from 'express';
import { register, login, getMe, updateCalculatorPassword, verifyRecoveryKey, resetPasswordViaKey, deleteAccount, makeAdmin, updateProfile, upgradeSubscription } from '../controllers/authController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);

// Recovery Key Forgot Password Flow
router.post('/verify-recovery-key', verifyRecoveryKey);
router.post('/reset-password-via-key', resetPasswordViaKey);

// New endpoints
router.get('/me', protect, getMe);
router.put('/calculator-password', protect, updateCalculatorPassword);
router.put('/profile', protect, updateProfile); // New profile update route
router.post('/upgrade', protect, upgradeSubscription); // Mock upgrade route
router.delete('/delete-account', protect, deleteAccount);
router.post('/make-admin', makeAdmin);

export default router;

