import fs from 'fs';
import path from 'path';
import { getStorage } from '../services/firebaseService';

export async function uploadFileToStorage(
  localFilePath: string,
  serverId: string,
  fileName: string
): Promise<string> {
  const storage = getStorage();
  const bucket = storage.bucket();
  
  const timestamp = Date.now();
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  const storagePath = `kbs/${serverId}/${timestamp}-${sanitizedFileName}`;
  
  const file = bucket.file(storagePath);
  
  await file.save(fs.readFileSync(localFilePath), {
    metadata: {
      contentType: path.extname(fileName) === '.pdf' ? 'application/pdf' : 'text/csv',
    },
  });
  
  return storagePath;
}

export function cleanupTempFile(filePath: string): void {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.error(`Failed to delete temp file ${filePath}:`, error);
  }
}
