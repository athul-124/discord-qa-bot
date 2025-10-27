import * as admin from 'firebase-admin';

let firebaseInitialized = false;

export function initializeFirebase(): admin.app.App {
  if (firebaseInitialized) {
    return admin.app();
  }

  try {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (!projectId || !clientEmail || !privateKey) {
      throw new Error('Missing Firebase configuration in environment variables');
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
    throw error;
  }
}

export function getFirestore(): admin.firestore.Firestore {
  if (!firebaseInitialized) {
    initializeFirebase();
  }
  return admin.firestore();
}
