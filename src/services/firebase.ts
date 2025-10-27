import * as admin from 'firebase-admin';

let firebaseInitialized = false;

export function initializeFirebase(): admin.app.App | null {
  if (firebaseInitialized) {
    return admin.app();
  }

  try {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (!projectId || !clientEmail || !privateKey) {
      console.warn('[Firebase] Missing configuration in environment variables - running in stub mode');
      firebaseInitialized = true;
      return null;
    }

    if (privateKey.includes('stub_key_placeholder')) {
      console.warn('[Firebase] Stub credentials detected - running in stub mode');
      firebaseInitialized = true;
      return null;
    }

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });

    firebaseInitialized = true;
    console.log('[Firebase] Successfully initialized');
    return admin.app();
  } catch (error) {
    console.error('[Firebase] Initialization error:', error);
    if (process.env.NODE_ENV === 'development') {
      console.warn('[Firebase] Continuing in stub mode for development');
      firebaseInitialized = true;
      return null;
    }
    throw error;
  }
}

export function getFirestore(): admin.firestore.Firestore {
  if (!firebaseInitialized) {
    initializeFirebase();
  }
  return admin.firestore();
}
