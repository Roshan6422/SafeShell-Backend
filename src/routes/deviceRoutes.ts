
import express from 'express';
import { registerDevice, sendCommand } from '../controllers/deviceController';
import { protect } from '../middleware/authMiddleware';
import { admin } from '../middleware/adminMiddleware';

const router = express.Router();

// Register device (Authenticated User)
router.post('/register', protect, registerDevice);

// Send command (Admin Only)
router.post('/command', protect, admin, sendCommand);

export default router;
