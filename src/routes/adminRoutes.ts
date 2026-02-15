import express from 'express';
import { getAllUsers, getAllPayments, getAllTickets, replyToTicket, deleteUser, updateTicketStatus, updateUserStatus, updateUserSubscription, updateUserRole, blockUser, activateUser, sendNotification } from '../controllers/adminController';
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
router.patch('/tickets/:id/status', updateTicketStatus);
router.delete('/users/:id', deleteUser);
router.patch('/users/:id/status', updateUserStatus);
router.patch('/users/:id/subscription', updateUserSubscription);
router.patch('/users/:id/role', updateUserRole);
router.put('/users/:id/block', blockUser);
router.put('/users/:id/activate', activateUser);
router.post('/notify', sendNotification);

export default router;
