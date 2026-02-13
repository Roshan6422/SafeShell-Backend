import app from './app';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

import { seedAdmin } from './utils/seed';

const startServer = async () => {
    try {
        if (MONGO_URI) {
            await mongoose.connect(MONGO_URI);
            console.log('Connected to MongoDB (Cloud/External)');
            await seedAdmin();
        } else {
            console.log('No MONGO_URI provided. Attempting to start in-memory server...');
            const { MongoMemoryServer } = await import('mongodb-memory-server');
            const mongod = await MongoMemoryServer.create();
            const uri = mongod.getUri();
            await mongoose.connect(uri);
            console.log(`Connected to in-memory MongoDB at ${uri}`);
            await seedAdmin();
        }
    } catch (err) {
        console.error('Database connection failed:', err);
        process.exit(1);
    }

    app.listen(Number(PORT), '0.0.0.0', () => {
        console.log(`Server running on port ${PORT}`);
    });
};

startServer();

