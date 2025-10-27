import { Request, Response, NextFunction } from 'express';
import * as admin from 'firebase-admin';
import { whopService } from '../services/whopService';

let firebaseInitialized = false;

function initializeFirebase(): void {
  if (firebaseInitialized) return;

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) {
    console.warn('Firebase credentials not configured - Firebase auth disabled');
    return;
  }

  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
    firebaseInitialized = true;
    console.log('Firebase Admin initialized');
  } catch (error) {
    console.error('Error initializing Firebase:', error);
  }
}

export interface AuthRequest extends Request {
  userId?: string;
  whopCustomerId?: string;
  authMethod?: 'firebase' | 'whop';
}

export async function authenticateRequest(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.status(401).json({ error: 'Authorization header required' });
    return;
  }

  const token = authHeader.replace('Bearer ', '');

  const firebaseAuth = await authenticateFirebase(token);
  if (firebaseAuth.success) {
    req.userId = firebaseAuth.userId;
    req.authMethod = 'firebase';
    next();
    return;
  }

  const whopAuth = await authenticateWhop(token);
  if (whopAuth.success) {
    req.whopCustomerId = whopAuth.customerId;
    req.authMethod = 'whop';
    next();
    return;
  }

  res.status(401).json({ error: 'Invalid or expired token' });
}

async function authenticateFirebase(token: string): Promise<{ success: boolean; userId?: string }> {
  if (!firebaseInitialized) {
    initializeFirebase();
  }

  if (!firebaseInitialized) {
    return { success: false };
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    return { success: true, userId: decodedToken.uid };
  } catch (error) {
    return { success: false };
  }
}

async function authenticateWhop(token: string): Promise<{ success: boolean; customerId?: string }> {
  try {
    const validation = await whopService.validateToken(token);
    if (validation.valid && validation.user) {
      return { success: true, customerId: validation.user.id };
    }
    return { success: false };
  } catch (error) {
    return { success: false };
  }
}

export function optionalAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    next();
    return;
  }

  authenticateRequest(req, res, next).catch(() => next());
}
