import { Request, Response } from 'express';
import path from 'path';
import { processCsvFile } from '../utils/csvProcessor';
import { processPdfFile } from '../utils/pdfProcessor';
import { uploadFileToStorage, cleanupTempFile } from '../utils/storageUtils';
import { saveKnowledgeEntries, saveIngestionMetadata } from '../services/knowledgeBaseService';
import { IngestionSummary } from '../types';

export async function handleKbUpload(req: Request, res: Response) {
  let tempFilePath: string | undefined;
  
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'No file uploaded. Please provide a file in the "file" field.',
      });
    }
    
    const serverId = (req as any).serverId;
    if (!serverId) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Missing serverId',
      });
    }
    
    tempFilePath = req.file.path;
    const fileName = req.file.originalname;
    const fileSize = req.file.size;
    const fileExtension = path.extname(fileName).toLowerCase();
    
    if (!['.csv', '.pdf'].includes(fileExtension)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Unsupported file type. Only CSV and PDF files are accepted.',
      });
    }
    
    let result: { entries: any[]; summary: IngestionSummary };
    
    if (fileExtension === '.csv') {
      result = await processCsvFile(tempFilePath, serverId, '');
    } else {
      result = await processPdfFile(tempFilePath, serverId, '');
    }
    
    let storagePath = '';
    try {
      storagePath = await uploadFileToStorage(tempFilePath, serverId, fileName);
    } catch (storageError: any) {
      console.error('Storage upload failed:', storageError);
      storagePath = `local/${fileName}`;
    }
    
    const entriesWithPath = result.entries.map(entry => ({
      ...entry,
      sourceFilePath: storagePath,
    }));
    
    await saveKnowledgeEntries(entriesWithPath);
    
    await saveIngestionMetadata({
      serverId,
      fileName,
      fileSize,
      fileType: fileExtension,
      entriesCreated: result.summary.entriesCreated,
      entriesSkipped: result.summary.entriesSkipped,
      errors: result.summary.errors,
      sourceFilePath: storagePath,
      timestamp: new Date(),
    });
    
    res.status(200).json({
      success: true,
      entriesCreated: result.summary.entriesCreated,
      entriesSkipped: result.summary.entriesSkipped,
      errors: result.summary.errors,
      sourceFilePath: storagePath,
    });
  } catch (error: any) {
    console.error('Upload processing error:', error);
    
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Failed to process file';
    
    res.status(statusCode).json({
      error: 'Processing Failed',
      message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  } finally {
    if (tempFilePath) {
      cleanupTempFile(tempFilePath);
    }
  }
}
