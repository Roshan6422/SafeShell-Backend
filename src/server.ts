import dotenv from 'dotenv';
dotenv.config();

import app from './app';
import { verifyFirestoreConnection } from './config/firebase';

const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {
        // Verify Firestore is actually reachable; falls back to in-memory if not
        await verifyFirestoreConnection();
        console.log('Database layer ready.');
    } catch (err) {
        console.error('Server startup failed:', err);
        process.exit(1);
    }

    const server = app.listen(Number(PORT), '0.0.0.0', () => {
        console.log(`Server running on port ${PORT}`);
    });

    // Handle process-level errors
    process.on('unhandledRejection', (err: any) => {
        console.error('😡 Unhandled Rejection:', err.message);
        // Keep server running but log it
    });

    process.on('uncaughtException', (err: any) => {
        console.error('💀 Uncaught Exception:', err.message);
        // For uncaught exceptions, it's safer to log and exit gracefully
        server.close(() => process.exit(1));
    });
};

startServer();
