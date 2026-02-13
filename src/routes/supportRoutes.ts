import express from 'express';
import { createTicket, getMyTickets } from '../controllers/supportController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.post('/', protect, createTicket);
router.get('/', protect, getMyTickets);

export default router;
