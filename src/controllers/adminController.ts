import { Request, Response } from 'express';
import User from '../models/User';
import Payment from '../models/Payment';
import SupportTicket from '../models/SupportTicket';
import { AuthRequest } from '../middleware/authMiddleware';

export const getAllUsers = async (req: Request, res: Response) => {
    try {
        const users = await User.find().select('-password');
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

export const getAllPayments = async (req: Request, res: Response) => {
    try {
        const payments = await Payment.find().populate('user', 'name email');
        res.json(payments);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

export const getAllTickets = async (req: Request, res: Response) => {
    try {
        const tickets = await SupportTicket.find().populate('user', 'name email').sort({ createdAt: -1 });
        res.json(tickets);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

export const replyToTicket = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { message } = req.body;

        const ticket = await SupportTicket.findById(id);
        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        ticket.replies.push({
            sender: 'admin',
            message,
            date: new Date()
        });

        if (ticket.status === 'open') {
            // Optional: Change status logic if needed, but keeping it open for conversation is fine
            // or maybe 'replied'? sticking to schema enum 'open'/'closed'
        }

        await ticket.save();
        res.json(ticket);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};
