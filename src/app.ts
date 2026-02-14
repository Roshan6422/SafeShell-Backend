import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import path from 'path';

const app: Application = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // PayHere webhook sends form-encoded data
app.use(cors({
    origin: (origin, callback) => callback(null, true), // Allow all origins while supporting credentials
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

// Request logger
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`${req.method} ${req.path} [${res.statusCode}] - ${duration}ms`);
    });
    next();
});

// Serve uploaded files
const uploadsPath = process.env.UPLOADS_PATH || 'd:\\SafeShell\\data\\uploads';
app.use('/uploads', express.static(uploadsPath));

// Routes
import authRoutes from './routes/authRoutes';
import vaultRoutes from './routes/vaultRoutes';
import adminRoutes from './routes/adminRoutes';
import supportRoutes from './routes/supportRoutes';
import paymentRoutes from './routes/paymentRoutes';

app.use('/api/auth', authRoutes);
app.use('/api/vault', vaultRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/payment', paymentRoutes);

// Health Check
app.get('/api/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', message: 'Server is running' });
});

// Global Error Handler
app.use((err: any, req: Request, res: Response, next: any) => {
    console.error('💥 Unhandled Error:', err);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal Server Error',
        error: process.env.NODE_ENV === 'development' ? err : {}
    });
});

export default app;
