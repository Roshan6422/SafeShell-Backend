import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import fs from 'fs';

const app: Application = express();

// Security Middleware
app.use(helmet());
app.use(cors({
    origin: (origin, callback) => callback(null, true), // Allow all origins while supporting credentials
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

// Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api', limiter);

// Request logger
app.use((req, res, next) => {
    const start = Date.now();
    console.log(`[INCOMING] ${req.method} ${req.url} (Path: ${req.path})`);
    res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`[OUTGOING] ${req.method} ${req.path} [${res.statusCode}] - ${duration}ms`);
    });
    next();
});

// Serve uploaded files
const uploadsPath = process.env.UPLOADS_PATH || path.join(process.cwd(), 'data', 'uploads');
if (!fs.existsSync(uploadsPath)) {
    fs.mkdirSync(uploadsPath, { recursive: true });
}
app.use('/uploads', express.static(uploadsPath));

// Routes
import authRoutes from './routes/authRoutes';
import vaultRoutes from './routes/vaultRoutes';
import adminRoutes from './routes/adminRoutes';
import supportRoutes from './routes/supportRoutes';
import paymentRoutes from './routes/paymentRoutes';
import deviceRoutes from './routes/deviceRoutes';

app.use('/api/auth', authRoutes);
app.use('/api/vault', vaultRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/device', deviceRoutes);

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
