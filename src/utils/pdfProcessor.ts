import fs from 'fs';
import * as pdfParse from 'pdf-parse';
import { normalizeWhitespace, extractKeywords } from './textProcessing';
import { KnowledgeEntry, IngestionSummary } from '../types';

export async function processPdfFile(
  filePath: string,
  serverId: string,
  sourceFilePath: string
): Promise<{ entries: KnowledgeEntry[]; summary: IngestionSummary }> {
  const dataBuffer = fs.readFileSync(filePath);
  const pdfData = await (pdfParse as any)(dataBuffer);
  
  const entries: KnowledgeEntry[] = [];
  const errors: Array<{ chunk?: number; message: string }> = [];
  let skipped = 0;
  
  const chunks = pdfData.text.split(/\n\s*\n/);
  
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i].trim();
    
    if (!chunk) continue;
    
    const qaPair = extractQAPair(chunk);
    
    if (!qaPair) {
      errors.push({
        chunk: i + 1,
        message: `Could not extract Q&A pair from chunk: "${chunk.substring(0, 50)}..."`,
      });
      skipped++;
      continue;
    }
    
    const { question, answer } = qaPair;
    
    if (!question || !answer) {
      errors.push({
        chunk: i + 1,
        message: 'Question or answer is empty after extraction',
      });
      skipped++;
      continue;
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
  }
  
  return {
    entries,
    summary: {
      entriesCreated: entries.length,
      entriesSkipped: skipped,
      errors,
    },
  };
}

function extractQAPair(chunk: string): { question: string; answer: string } | null {
  const qPatterns = [
    /Q:\s*(.+?)(?:A:|$)/is,
    /Question:\s*(.+?)(?:Answer:|$)/is,
    /\?\s*(.+?)(?:A:|Answer:|$)/is,
  ];
  
  const aPatterns = [
    /A:\s*(.+?)$/is,
    /Answer:\s*(.+?)$/is,
  ];
  
  let question = '';
  let answer = '';
  
  for (const pattern of qPatterns) {
    const qMatch = chunk.match(pattern);
    if (qMatch) {
      question = normalizeWhitespace(qMatch[1]);
      break;
    }
  }
  
  for (const pattern of aPatterns) {
    const aMatch = chunk.match(pattern);
    if (aMatch) {
      answer = normalizeWhitespace(aMatch[1]);
      break;
    }
  }
  
  if (!question && chunk.includes('?')) {
    const parts = chunk.split('?');
    if (parts.length >= 2) {
      question = normalizeWhitespace(parts[0] + '?');
      answer = normalizeWhitespace(parts.slice(1).join('?'));
    }
  }
  
  if (!question || !answer) {
    return null;
  }
  
  return { question, answer };
}
