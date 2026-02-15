import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from './authMiddleware';

/**
 * Middleware to verify if the user has an admin role.
 * Ensures that only authenticated administrators can access protected dashboard routes.
 */
export const verifyAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({
            message: 'Access denied. Admin privileges required.',
            code: 'ADMIN_REQUIRED'
        });
    }
};
