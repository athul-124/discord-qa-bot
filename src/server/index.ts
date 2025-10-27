import express, { Request, Response } from 'express';
import multer from 'multer';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { initializeFirebase } from '../services/firebaseService';
import { authMiddleware } from '../middleware/auth';
import { errorHandler } from '../middleware/errorHandler';
import { handleKbUpload } from './uploadHandler';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({
  dest: uploadDir,
  limits: {
    fileSize: 20 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext !== '.csv' && ext !== '.pdf') {
      return cb(new Error('Only CSV and PDF files are allowed'));
    }
    cb(null, true);
  },
});

app.use(express.json());

app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

app.post('/upload-kb', authMiddleware, upload.single('file'), handleKbUpload);

app.use(errorHandler);

async function startServer() {
  try {
    initializeFirebase();
    
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/health`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
