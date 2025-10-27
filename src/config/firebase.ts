import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

let firebaseInitialized = false;
let firestoreInstance: admin.firestore.Firestore | null = null;
let storageInstance: admin.storage.Storage | null = null;
let authInstance: admin.auth.Auth | null = null;

interface FirebaseConfig {
  projectId: string;
  clientEmail: string;
  privateKey: string;
}

/**
 * Parse Firebase service account credentials from environment
 * Supports:
 * 1. FIREBASE_SERVICE_ACCOUNT as base64-encoded JSON
 * 2. FIREBASE_SERVICE_ACCOUNT as file path to JSON
 * 3. Individual env vars (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY)
 */
function getCredentials(): FirebaseConfig {
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;

  if (serviceAccount) {
    try {
      // Check if it's a file path
      if (fs.existsSync(serviceAccount)) {
        console.log('[Firebase] Loading credentials from file path');
        const fileContent = fs.readFileSync(serviceAccount, 'utf-8');
        const parsed = JSON.parse(fileContent);
        return {
          projectId: parsed.project_id,
          clientEmail: parsed.client_email,
          privateKey: parsed.private_key,
        };
      }

      // Try to decode as base64
      console.log('[Firebase] Attempting to decode base64 credentials');
      const decoded = Buffer.from(serviceAccount, 'base64').toString('utf-8');
      const parsed = JSON.parse(decoded);
      return {
        projectId: parsed.project_id,
        clientEmail: parsed.client_email,
        privateKey: parsed.private_key,
      };
    } catch (error) {
      throw new Error(
        `Invalid FIREBASE_SERVICE_ACCOUNT: must be a valid file path or base64-encoded JSON. Error: ${error}`
      );
    }
  }

  // Fall back to individual environment variables
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      'Missing Firebase configuration. Provide either FIREBASE_SERVICE_ACCOUNT or all of: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY'
    );
  }

  return { projectId, clientEmail, privateKey };
}

/**
 * Initialize Firebase Admin SDK
 * Supports local emulator via FIRESTORE_EMULATOR_HOST, FIREBASE_AUTH_EMULATOR_HOST, and FIREBASE_STORAGE_EMULATOR_HOST
 */
export function initializeFirebase(): admin.app.App {
  if (firebaseInitialized) {
    return admin.app();
  }

  try {
    const credentials = getCredentials();
    const useEmulator = process.env.USE_FIREBASE_EMULATOR === 'true';

    console.log(`[Firebase] Initializing with project: ${credentials.projectId}`);
    
    if (useEmulator) {
      console.log('[Firebase] Emulator mode enabled');
    }

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: credentials.projectId,
        clientEmail: credentials.clientEmail,
        privateKey: credentials.privateKey,
      }),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET || `${credentials.projectId}.appspot.com`,
    });

    firebaseInitialized = true;

    // Initialize services
    firestoreInstance = admin.firestore();
    storageInstance = admin.storage();
    authInstance = admin.auth();

    // Configure emulator if needed
    if (useEmulator) {
      const firestoreHost = process.env.FIRESTORE_EMULATOR_HOST || 'localhost:8080';
      console.log(`[Firebase] Using Firestore emulator at ${firestoreHost}`);
      
      // Emulator configuration is handled by FIRESTORE_EMULATOR_HOST environment variable
      // which is automatically detected by the Firebase Admin SDK
    }

    console.log('[Firebase] Successfully initialized');
    return admin.app();
  } catch (error) {
    console.error('[Firebase] Initialization error:', error);
    if (error instanceof Error) {
      throw new Error(`Firebase initialization failed: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Get Firestore instance
 */
export function getFirestore(): admin.firestore.Firestore {
  if (!firebaseInitialized) {
    initializeFirebase();
  }
  if (!firestoreInstance) {
    firestoreInstance = admin.firestore();
  }
  return firestoreInstance;
}

/**
 * Get Storage instance
 */
export function getStorage(): admin.storage.Storage {
  if (!firebaseInitialized) {
    initializeFirebase();
  }
  if (!storageInstance) {
    storageInstance = admin.storage();
  }
  return storageInstance;
}

/**
 * Get Auth instance
 */
export function getAuth(): admin.auth.Auth {
  if (!firebaseInitialized) {
    initializeFirebase();
  }
  if (!authInstance) {
    authInstance = admin.auth();
  }
  return authInstance;
}

/**
 * Check if Firebase is initialized
 */
export function isInitialized(): boolean {
  return firebaseInitialized;
}

/**
 * Get Firebase app instance
 */
export function getApp(): admin.app.App {
  if (!firebaseInitialized) {
    initializeFirebase();
  }
  return admin.app();
}
