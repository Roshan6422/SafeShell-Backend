import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';

export interface AuthRequest extends Request {
    user?: any;
}

export const protect = async (req: AuthRequest, res: Response, next: NextFunction) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret123') as any;

            const user = await User.findById(decoded.id);
            if (user) {
                delete user.password; // Manually remove password
                req.user = user;
            }

            if (!req.user) {
                console.warn(`[Auth] User not found for ID: ${decoded.id}`);
                res.status(401).json({ message: 'Not authorized, user not found' });
                return;
            }

            if (req.user.isSuspended) {
                res.status(403).json({ message: 'Account suspended' });
                return;
            }

            next();
            return;
        } catch (error: any) {
            console.error('[Auth] Token verification failed:', error.message);
            res.status(401).json({ message: 'Not authorized, token failed' });
            return;
        }
    }

    if (!token) {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

