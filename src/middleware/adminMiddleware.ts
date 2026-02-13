import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from './authMiddleware';

export const admin = (req: AuthRequest, res: Response, next: NextFunction) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(401).json({ message: 'Not authorized as an admin' });
    }
};
