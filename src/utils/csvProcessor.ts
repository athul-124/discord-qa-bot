import fs from 'fs';
import csvParser from 'csv-parser';
import { normalizeWhitespace, extractKeywords } from './textProcessing';
import { KnowledgeEntry, IngestionSummary } from '../types';

export async function processCsvFile(
  filePath: string,
  serverId: string,
  sourceFilePath: string
): Promise<{ entries: KnowledgeEntry[]; summary: IngestionSummary }> {
  const entries: KnowledgeEntry[] = [];
  const errors: Array<{ line?: number; message: string }> = [];
  let lineNumber = 1;
  let skipped = 0;
  
  return new Promise((resolve, reject) => {
    const stream = fs.createReadStream(filePath)
      .pipe(csvParser());
    
    stream.on('data', (row: any) => {
      lineNumber++;
      
      if (!row.question || !row.answer) {
        errors.push({
          line: lineNumber,
          message: `Missing required fields 'question' or 'answer'`,
        });
        skipped++;
        return;
      }
      
      const question = normalizeWhitespace(row.question);
      const answer = normalizeWhitespace(row.answer);
      
      if (!question || !answer) {
        errors.push({
          line: lineNumber,
          message: 'Question or answer is empty after normalization',
        });
        skipped++;
        return;
      }
      
      const keywords = extractKeywords(`${question} ${answer}`);
      
      entries.push({
        question,
        answer,
        keywords,
        serverId,
        sourceFilePath,
        createdAt: new Date(),
      });
    });
    
    stream.on('end', () => {
      resolve({
        entries,
        summary: {
          entriesCreated: entries.length,
          entriesSkipped: skipped,
          errors,
        },
      });
    });
    
    stream.on('error', (error) => {
      reject(new Error(`CSV parsing error: ${error.message}`));
    });
  });
}
