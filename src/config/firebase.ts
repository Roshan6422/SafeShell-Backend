import admin from 'firebase-admin';
import dotenv from 'dotenv';
import path from 'path';
import * as fs from 'fs';

dotenv.config();

let serviceAccount: any;
let firebaseInitialized = false;

try {
    const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || path.join(__dirname, '../../serviceAccountKey.json');
    if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
        const decodedKey = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf8');
        serviceAccount = JSON.parse(decodedKey);
    } else if (fs.existsSync(serviceAccountPath)) {
        serviceAccount = require(serviceAccountPath);
    }
} catch (error) {
    console.warn('⚠️  Firebase Service Account Key not found or invalid.');
    console.warn('   The server will start in IN-MEMORY mode (data will not persist).');
}

if (serviceAccount && !admin.apps.length) {
    try {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
        });
        firebaseInitialized = true;
        console.log('✅ Firebase Admin Initialized');
    } catch (error) {
        console.error('Firebase Initialization Error:', error);
    }
}

// Only create Firestore reference if Firebase is initialized
let db: admin.firestore.Firestore | null = null;
if (firebaseInitialized) {
    db = admin.firestore();
}

export { db, firebaseInitialized };
export default admin;
