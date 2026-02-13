import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import path from 'path';

const app: Application = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // PayHere webhook sends form-encoded data
app.use(cors());

// Request logger
app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
});

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

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

export default app;
