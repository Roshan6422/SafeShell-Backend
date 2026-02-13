import express from 'express';
import { generateHash, payhereNotify, getPaymentHistory, getAllPayments } from '../controllers/paymentController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.post('/generate-hash', protect, generateHash);
router.post('/notify', payhereNotify); // Public — called by PayHere servers
router.get('/history', protect, getPaymentHistory);
router.get('/all', protect, getAllPayments); // Admin route

export default router;
