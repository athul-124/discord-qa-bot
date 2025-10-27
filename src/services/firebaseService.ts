import * as admin from 'firebase-admin';

let firebaseApp: admin.app.App;
let db: admin.firestore.Firestore;
let storage: admin.storage.Storage;

export function initializeFirebase() {
  if (!firebaseApp) {
    if (process.env.FIREBASE_PROJECT_ID && process.env.NODE_ENV === 'development') {
      firebaseApp = admin.initializeApp({
        projectId: process.env.FIREBASE_PROJECT_ID,
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET || `${process.env.FIREBASE_PROJECT_ID}.appspot.com`,
      });
      
      if (process.env.FIRESTORE_EMULATOR_HOST) {
        process.env.FIRESTORE_EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST;
      }
      
      if (process.env.FIREBASE_STORAGE_EMULATOR_HOST) {
        process.env.FIREBASE_STORAGE_EMULATOR_HOST = process.env.FIREBASE_STORAGE_EMULATOR_HOST;
      }
    } else if (process.env.SERVICE_ACCOUNT_JSON) {
      const serviceAccount = JSON.parse(process.env.SERVICE_ACCOUNT_JSON);
      firebaseApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      });
    } else if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
      const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');
      firebaseApp = admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: privateKey,
        }),
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET || `${process.env.FIREBASE_PROJECT_ID}.appspot.com`,
      });
    } else if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
      const serviceAccount = require(process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
      firebaseApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      });
    } else {
      firebaseApp = admin.initializeApp();
    }
    
    db = firebaseApp.firestore();
    storage = firebaseApp.storage();
  }
  
  return { firebaseApp, db, storage };
}

export function getFirestore(): admin.firestore.Firestore {
  if (!db) {
    const { db: database } = initializeFirebase();
    return database;
  }
  return db;
}

export function getStorage(): admin.storage.Storage {
  if (!storage) {
    const { storage: store } = initializeFirebase();
    return store;
  }
  return storage;
}
