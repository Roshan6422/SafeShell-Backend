import app from './app';
import dotenv from 'dotenv';
import './config/firebase'; // Initialize Firebase

dotenv.config();

const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {
        // Firebase is initialized via import
        console.log('Firebase initialized.');

    } catch (err) {
        console.error('Server startup failed:', err);
        process.exit(1);
    }

    app.listen(Number(PORT), '0.0.0.0', () => {
        console.log(`Server running on port ${PORT}`);
    });
};

startServer();
