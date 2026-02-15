import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import * as nodemailer from "nodemailer";
import User from '../models/User';
import { AuthRequest } from '../middleware/authMiddleware';

const generateToken = (id: string) => {
    return jwt.sign({ id }, process.env.JWT_SECRET || 'secret123', {
        expiresIn: '30d',
    });
};

export const register = async (req: Request, res: Response) => {
    try {
        const { name, email, password, adminSecret } = req.body;

        const userExists = await User.findOne({ email });

        if (userExists) {
            res.status(400).json({ message: 'User already exists' });
            return;
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Generate Recovery Key (e.g., SAFE-XXXX-XXXX)
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let keyPart1 = '';
        let keyPart2 = '';
        for (let i = 0; i < 4; i++) keyPart1 += chars.charAt(Math.floor(Math.random() * chars.length));
        for (let i = 0; i < 4; i++) keyPart2 += chars.charAt(Math.floor(Math.random() * chars.length));
        const recoveryKey = `SAFE-${keyPart1}-${keyPart2}`;

        // Determine role based on secret
        const role = (adminSecret === process.env.ADMIN_SECRET || adminSecret === 'admin-secret-123') ? 'admin' : 'user';

        const user = await User.create({
            name: name || 'User',
            email,
            password: hashedPassword,
            recoveryKey: recoveryKey,
            role: role
        });

        if (user) {
            res.status(201).json({
                _id: user._id,
                name: user.name,
                email: user.email,
                token: generateToken(user._id.toString()),
                recoveryKey: user.recoveryKey,
                role: user.role,
                subscriptionStatus: user.subscriptionStatus,
                subscriptionExpiry: user.subscriptionExpiry
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });

        if (user && (await bcrypt.compare(password, user.password || ''))) {
            if (user.isSuspended) {
                return res.status(403).json({ message: 'Account suspended. Please contact support.' });
            }

            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                token: generateToken(user._id.toString()),
                role: user.role,
                subscriptionStatus: user.subscriptionStatus,
                subscriptionExpiry: user.subscriptionExpiry
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const getMe = async (req: AuthRequest, res: Response) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            recoveryKey: user.recoveryKey,
            hasCalculatorPassword: !!user.calculatorPassword,
            calculatorPassword: user.calculatorPassword,
            role: user.role,
            subscriptionStatus: user.subscriptionStatus,
            subscriptionExpiry: user.subscriptionExpiry
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

export const updateCalculatorPassword = async (req: AuthRequest, res: Response) => {
    try {
        const { oldPassword, newPassword } = req.body;
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Validate numeric only
        if (!/^\d+$/.test(newPassword)) {
            return res.status(400).json({ message: 'Password must be numeric only' });
        }

        // If user already has a calculator password, verify the old one
        if (user.calculatorPassword) {
            if (user.calculatorPassword !== oldPassword) {
                return res.status(401).json({ message: 'Incorrect old password' });
            }
        }

        user.calculatorPassword = newPassword;
        await user.save();

        res.json({ message: 'Calculator password updated successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

export const upgradeSubscription = async (req: AuthRequest, res: Response) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.subscriptionStatus = 'premium';
        user.subscriptionExpiry = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year from now
        await user.save();

        res.json({
            message: 'Subscription upgraded successfully',
            subscriptionStatus: user.subscriptionStatus,
            subscriptionExpiry: user.subscriptionExpiry
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
    try {
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.name = req.body.name || user.name;
        user.email = req.body.email || user.email;

        if (req.body.password) {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(req.body.password, salt);
        }

        const updatedUser = await user.save();

        res.json({
            _id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            role: updatedUser.role,
            subscriptionStatus: updatedUser.subscriptionStatus,
            subscriptionExpiry: updatedUser.subscriptionExpiry,
            token: generateToken(updatedUser._id.toString()),
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

export const deleteAccount = async (req: AuthRequest, res: Response) => {
    try {
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        await user.deleteOne();

        res.json({ message: 'Account deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const verifyRecoveryKey = async (req: Request, res: Response) => {
    try {
        const { email, recoveryKey } = req.body;

        if (!email || !recoveryKey) {
            return res.status(400).json({ message: "Missing email or recovery key" });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Check if user has a recovery key
        if (!user.recoveryKey) {
            return res.status(400).json({ message: "Account has no recovery key setup. Please contact support." });
        }

        if (user.recoveryKey !== recoveryKey) {
            return res.status(400).json({ message: "Invalid Recovery Key" });
        }

        res.json({ message: "Verification successful" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};

export const resetPasswordViaKey = async (req: Request, res: Response) => {
    try {
        const { email, recoveryKey, newPassword } = req.body;

        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: "User not found" });

        // Double check key before resetting
        if (user.recoveryKey !== recoveryKey) {
            return res.status(401).json({ message: "Unauthorized: Invalid Key" });
        }

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);

        await user.save();

        res.json({ message: "Password reset success" });
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};


// Old functions kept for reference or backward compatibility if needed
export const forgotPassword = async (req: Request, res: Response) => {
    // ... (existing implementation)
    res.status(410).json({ message: "Endpoint deprecated. Use reCAPTCHA flow." });
};

export const verifyOtp = async (req: Request, res: Response) => {
    // ...
    res.status(410).json({ message: "Endpoint deprecated. Use reCAPTCHA flow." });
};

export const resetPassword = async (req: Request, res: Response) => {
    // ...
    res.status(410).json({ message: "Endpoint deprecated. Use reCAPTCHA flow." });
};

export const makeAdmin = async (req: Request, res: Response) => {
    try {
        const { secret, email } = req.body;

        // Simple protection
        if (secret !== process.env.ADMIN_SECRET && secret !== 'admin-secret-123') {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.role = 'admin';
        await user.save();

        res.json({ message: `User ${user.email} is now an admin` });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};
