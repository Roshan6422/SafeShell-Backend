
import { Response } from 'express';
import admin from '../config/firebase';
import User from '../models/User';
import { AuthRequest } from '../middleware/authMiddleware';

// Register Device Token
export const registerDevice = async (req: AuthRequest, res: Response) => {
    try {
        const { token } = req.body;
        const userId = req.user?._id;

        if (!token) {
            return res.status(400).json({ message: 'Device token is required' });
        }

        if (!userId) {
            return res.status(401).json({ message: 'User not authenticated' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Update user with new device token
        user.deviceToken = token;
        await user.save();

        res.status(200).json({ message: 'Device registered successfully' });
    } catch (error: any) {
        res.status(500).json({ message: error.message || 'Server error' });
    }
};

// Send Command to Device (Admin Only)
export const sendCommand = async (req: AuthRequest, res: Response) => {
    try {
        const { userId, command, payload } = req.body;

        if (!userId || !command) {
            return res.status(400).json({ message: 'User ID and command are required' });
        }

        const targetUser = await User.findById(userId);
        if (!targetUser) {
            return res.status(404).json({ message: 'Target user not found' });
        }

        if (!targetUser.deviceToken) {
            return res.status(400).json({ message: 'User has no registered device' });
        }

        const message = {
            data: {
                type: 'COMMAND',
                command: command, // e.g., 'LOCK', 'ALARM', 'LOCATION'
                payload: payload ? JSON.stringify(payload) : '',
                timestamp: Date.now().toString(),
            },
            token: targetUser.deviceToken,
        };

        const { firebaseState } = require('../config/firebase');
        if (!firebaseState.firebaseInitialized) {
            return res.status(503).json({ message: 'Firebase service is not initialized' });
        }

        const response = await admin.messaging().send(message);

        res.status(200).json({
            message: `Command '${command}' sent successfully`,
            fcmResponse: response
        });
    } catch (error: any) {
        console.error('FCM Error:', error);
        res.status(500).json({ message: 'Failed to send command', error: error.message });
    }
};
