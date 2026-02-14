import { Request, Response } from 'express';
import User from '../models/User';
import Payment from '../models/Payment';
import SupportTicket from '../models/SupportTicket';
import { AuthRequest } from '../middleware/authMiddleware';

export const getAllUsers = async (req: Request, res: Response) => {
    try {
        const users = await User.find();
        const safeUsers = users.map((u: any) => {
            const { password, ...rest } = u;
            return rest;
        });
        res.json(safeUsers);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

export const getAllPayments = async (req: Request, res: Response) => {
    try {
        const payments = await Payment.find();
        const populatedPayments = await Promise.all(payments.map(async (p: any) => {
            const user = await User.findById(p.user);
            return {
                ...p,
                user: user ? { _id: user._id, name: user.name, email: user.email } : null
            };
        }));
        res.json(populatedPayments);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

export const getAllTickets = async (req: Request, res: Response) => {
    try {
        const tickets = await SupportTicket.find({}, { createdAt: -1 });
        const populatedTickets = await Promise.all(tickets.map(async (t: any) => {
            const user = await User.findById(t.user);
            return {
                ...t,
                user: user ? { _id: user._id, name: user.name, email: user.email } : null
            };
        }));
        res.json(populatedTickets);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

export const replyToTicket = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params as { id: string };
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

export const deleteUser = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params as { id: string };

        // Prevent admin from deleting themselves
        if (id === req.user._id.toString()) {
            return res.status(400).json({ message: 'You cannot delete your own admin account' });
        }

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // 1. Delete user
        await user.deleteOne();

        // 2. Cascade delete associated data
        await Payment.deleteMany({ user: id });
        await SupportTicket.deleteMany({ user: id });

        // Note: Vault items could also be deleted if desired
        // import VaultItem from '../models/VaultItem';
        // await VaultItem.deleteMany({ user: id });

        res.json({ message: 'User and associated data deleted successfully' });
    } catch (error) {
        console.error('Delete User Error:', error);
        res.status(500).json({ message: 'Server error deleting user' });
    }
};
