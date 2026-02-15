import admin from 'firebase-admin';
import dotenv from 'dotenv';
import path from 'path';
import * as fs from 'fs';

dotenv.config();

/**
 * Shared state for Firebase and Firestore.
 * Using an object ensures that updates to these values are reflected across all modules
 * that import this object, solving issues with primitive binding in CommonJS.
 */
export const firebaseState = {
    db: null as admin.firestore.Firestore | null,
    firebaseInitialized: false,
};

let serviceAccount: any = null;

try {
    const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || path.join(__dirname, '../../serviceAccountKey.json');

    if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
        // Strip any whitespace/newlines that might have crept into the env variable during copy-paste
        const cleanBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64.replace(/\s/g, '');
        const decodedKey = Buffer.from(cleanBase64, 'base64').toString('utf8');
        serviceAccount = JSON.parse(decodedKey);
    } else if (fs.existsSync(serviceAccountPath)) {
        serviceAccount = require(serviceAccountPath);
    }
} catch (error) {
    console.warn('⚠️  Firebase Service Account Key not found or invalid during initial load.');
}

if (serviceAccount && !admin.apps.length) {
    try {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
        });
        firebaseState.firebaseInitialized = true;
        firebaseState.db = admin.firestore();
        console.log('✅ Firebase Admin SDK Initialized');
    } catch (error) {
        console.error('Firebase Initialization Error:', error);
    }
}

/**
 * Tests the actual Firestore connection by performing a small read with a timeout.
 * If Firestore is unreachable or misconfigured, drops back to in-memory mode.
 */
export async function verifyFirestoreConnection(): Promise<void> {
    if (!firebaseState.firebaseInitialized || !firebaseState.db) {
        console.warn('⚠️  Firebase not initialized. Using IN-MEMORY mode.');
        return;
    }

    try {
        console.log('⏳ Verifying Firestore connection...');
        // Try a lightweight read to confirm Firestore is reachable, with a 5-second timeout
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Firestore connection timeout')), 5000)
        );

        await Promise.race([
            firebaseState.db.collection('_health_check').limit(1).get(),
            timeoutPromise
        ]);

        console.log('✅ Firestore connection verified');
    } catch (error: any) {
        console.error('❌ Firestore connection test failed:', error.message || error);
        console.warn('⚠️  Falling back to IN-MEMORY mode (data will not persist).');
        firebaseState.firebaseInitialized = false;
        firebaseState.db = null;
    }
}


export default admin;


