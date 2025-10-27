import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initializeFirebase } from '../services/firebase';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    message: 'Discord QA Bot API Server',
    version: '1.0.0',
  });
});

app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
  });
});

async function startServer(): Promise<void> {
  try {
    console.log('[Server] Starting Discord QA Bot API Server...');

    console.log('[Server] Initializing Firebase...');
    initializeFirebase();

    app.listen(PORT, () => {
      console.log(`[Server] API server listening on port ${PORT}`);
      console.log(`[Server] Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`[Server] Ready to accept requests`);
    });
  } catch (error) {
    console.error('[Server] Failed to start:', error);
    process.exit(1);
  }
}

process.on('unhandledRejection', (error) => {
  console.error('[Server] Unhandled promise rejection:', error);
});

process.on('SIGINT', () => {
  console.log('[Server] Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('[Server] Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

startServer();
