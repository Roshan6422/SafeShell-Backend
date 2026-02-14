import express from 'express';
import { getAllUsers, getAllPayments, getAllTickets, replyToTicket, deleteUser } from '../controllers/adminController';
import { protect } from '../middleware/authMiddleware';
import { admin } from '../middleware/adminMiddleware';

const router = express.Router();

// All routes here are protected and require admin role
router.use(protect);
router.use(admin);

router.get('/users', getAllUsers);
router.get('/payments', getAllPayments);
router.get('/tickets', getAllTickets);
router.post('/tickets/:id/reply', replyToTicket);
router.delete('/users/:id', deleteUser);

export default router;
