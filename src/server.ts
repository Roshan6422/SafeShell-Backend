import dotenv from 'dotenv';
dotenv.config();

import app from './app';
import { verifyFirestoreConnection } from './config/firebase';

const PORT = process.env.PORT || 5000;

const startServer = async () => {
    console.log(`[STARTUP] Starting server... NODE_ENV: ${process.env.NODE_ENV}`);
    console.log(`[STARTUP] Expected PORT: ${PORT}`);

    try {
        // Verify Firestore is actually reachable; falls back to in-memory if not
        console.log('[STARTUP] Initializing database layer...');
        await verifyFirestoreConnection();
        console.log('[STARTUP] Database layer ready.');
    } catch (err) {
        console.error('[CRITICAL] Database initialization failed:', err);
        process.exit(1); // Exit if database initialization fails
    }

    const server = app.listen(Number(PORT), '0.0.0.0', () => {
        console.log(`🚀 [SUCCESS] Server is live and listening on 0.0.0.0:${PORT}`);
    });

    // Handle process events
    process.on('unhandledRejection', (err: any) => {
        console.error('[ERROR] Unhandled Rejection:', err.message || err);
        // For unhandled rejections, it's generally safer to log and let the process continue,
        // unless it's a critical error that prevents further operation.
        // For now, we just log it.
    });

    process.on('uncaughtException', (err: any) => {
        console.error('[ERROR] Uncaught Exception:', err.message || err);
        // For uncaught exceptions, it's safer to log and exit gracefully
        server.close(() => process.exit(1));
    });

    process.on('SIGTERM', () => {
        console.log('[SHUTDOWN] SIGTERM received. Closing server...');
        server.close(() => {
            console.log('[SHUTDOWN] Server closed. Exiting process.');
            process.exit(0);
        });
    });

    process.on('SIGINT', () => {
        console.log('[SHUTDOWN] SIGINT received. Closing server...');
        server.close(() => {
            console.log('[SHUTDOWN] Server closed. Exiting process.');
            process.exit(0);
        });
    });
};

startServer();
