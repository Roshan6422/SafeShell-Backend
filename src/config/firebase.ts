import admin from 'firebase-admin';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

let serviceAccount: any;
let firebaseInitialized = false;

try {
    const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || path.join(__dirname, '../../serviceAccountKey.json');
    serviceAccount = require(serviceAccountPath);
} catch (error) {
    console.warn('⚠️  Firebase Service Account Key not found.');
    console.warn('   The server will start in IN-MEMORY mode (data will not persist).');
    console.warn('   To use Firebase, place serviceAccountKey.json in the backend root.');
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
