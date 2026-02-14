import { Request, Response } from 'express';
import SupportTicket from '../models/SupportTicket';
import { AuthRequest } from '../middleware/authMiddleware';

export const createTicket = async (req: AuthRequest, res: Response) => {
    try {
        const { subject, message } = req.body;
        const ticket = await SupportTicket.create({
            user: req.user.id,
            subject,
            message,
            replies: []
        });
        res.status(201).json(ticket);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

export const getMyTickets = async (req: AuthRequest, res: Response) => {
    try {
        const tickets = await SupportTicket.find({ user: req.user.id }, { createdAt: -1 });
        res.json(tickets);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};
