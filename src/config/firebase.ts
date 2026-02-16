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
        console.log('[FIREBASE] Found FIREBASE_SERVICE_ACCOUNT_BASE64 env variable');

        try {
            // ONLY remove whitespace (newlines, spaces) which are valid in Base64 formatting
            const rawBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
            const cleanBase64 = rawBase64.replace(/\s/g, '');

            console.log(`[FIREBASE] Raw B64 Start: ${rawBase64.substring(0, 10)}... End: ...${rawBase64.substring(rawBase64.length - 10)}`);
            console.log(`[FIREBASE] Base64 length: ${rawBase64.length} -> Cleaned length: ${cleanBase64.length}`);

            const decodedKey = Buffer.from(cleanBase64, 'base64').toString('utf8');
            console.log(`[FIREBASE] Decoded JSON length: ${decodedKey.length}`);

            // Log boundaries to check for truncation
            console.log(`[FIREBASE] JSON Start: ${decodedKey.substring(0, 40)}...`);
            console.log(`[FIREBASE] JSON End: ...${decodedKey.substring(decodedKey.length - 40)}`);

            try {
                serviceAccount = JSON.parse(decodedKey);
                console.log('[FIREBASE] JSON parse successful');
            } catch (parseErr: any) {
                // Pinpoint the error
                const posMatch = parseErr.message.match(/position (\d+)/);
                if (posMatch) {
                    const pos = parseInt(posMatch[1], 10);
                    const start = Math.max(0, pos - 20);
                    const end = Math.min(decodedKey.length, pos + 20);
                    console.error(`[FIREBASE] JSON Error at pos ${pos}: "...${decodedKey.substring(start, end)}..."`);
                }
                throw parseErr; // Re-throw to be caught by the outer try-catch for Base64 processing
            }
        } catch (err: any) {
            console.error(`[FIREBASE] Failed to decode/parse Base64: ${err.message}`);
        }
    } else if (fs.existsSync(serviceAccountPath)) {
        console.log('[FIREBASE] Found serviceAccountKey.json file');
        serviceAccount = require(serviceAccountPath);
    } else {
        console.warn('[FIREBASE] No credentials found (FIREBASE_SERVICE_ACCOUNT_BASE64 or serviceAccountKey.json)');
    }
} catch (error: any) {
    console.warn(`⚠️  Firebase Service Account Key not found or invalid during initial load: ${error.message}`);
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


