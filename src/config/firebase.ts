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
        console.log('✅ Firebase Admin SDK Initialized');
    } catch (error) {
        console.error('Firebase Initialization Error:', error);
    }
}

// Only create Firestore reference if Firebase is initialized
let db: admin.firestore.Firestore | null = null;
if (firebaseInitialized) {
    db = admin.firestore();
}

/**
 * Tests the actual Firestore connection by performing a small read.
 * If Firestore is unreachable or misconfigured, drops back to in-memory mode.
 */
async function verifyFirestoreConnection(): Promise<void> {
    if (!firebaseInitialized || !db) return;

    try {
        // Try a lightweight read to confirm Firestore is reachable
        await db.collection('_health_check').limit(1).get();
        console.log('✅ Firestore connection verified');
    } catch (error: any) {
        console.error('❌ Firestore connection test failed:', error.message || error);
        console.warn('⚠️  Falling back to IN-MEMORY mode (data will not persist).');
        firebaseInitialized = false;
        db = null;
    }
}

export { db, firebaseInitialized, verifyFirestoreConnection };
export default admin;

