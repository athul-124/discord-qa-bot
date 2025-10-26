import * as fs from 'fs';
import * as path from 'path';
const pdfParse = require('pdf-parse');

export interface KnowledgeBaseEntry {
  question: string;
  answer: string;
  keywords: string[];
  category?: string;
}

export class KnowledgeBaseParser {
  /**
   * Parse CSV file and extract knowledge base entries
   * @param filePath Path to CSV file
   * @returns Array of knowledge base entries
   */
  async parseCSV(filePath: string): Promise<KnowledgeBaseEntry[]> {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    const entries: KnowledgeBaseEntry[] = [];

    // Skip header row
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const parts = this.parseCSVLine(line);
      if (parts.length < 2) {
        // Invalid row - must have at least question and answer
        continue;
      }

      const [question, answer, keywordsStr, category] = parts;
      
      if (!question || !answer) {
        // Reject invalid rows
        continue;
      }

      const keywords = keywordsStr 
        ? keywordsStr.split(';').map(k => k.trim().toLowerCase()).filter(k => k)
        : this.extractKeywords(question + ' ' + answer);

      entries.push({
        question: question.trim(),
        answer: answer.trim(),
        keywords,
        category: category?.trim() || undefined
      });
    }

    return entries;
  }

  /**
   * Parse PDF file and extract knowledge base entries
   * @param filePath Path to PDF file
   * @returns Array of knowledge base entries
   */
  async parsePDF(filePath: string): Promise<KnowledgeBaseEntry[]> {
    const dataBuffer = fs.readFileSync(filePath);
    const pdfData = await pdfParse(dataBuffer);
    const text = pdfData.text;

    // Simple Q&A extraction - looks for Q: and A: patterns
    const entries: KnowledgeBaseEntry[] = [];
    const qaPattern = /Q:\s*(.+?)\s*A:\s*(.+?)(?=Q:|$)/gs;
    let match;

    while ((match = qaPattern.exec(text)) !== null) {
      const question = match[1].trim();
      const answer = match[2].trim();

      if (question && answer) {
        const keywords = this.extractKeywords(question + ' ' + answer);
        entries.push({
          question,
          answer,
          keywords
        });
      }
    }

    return entries;
  }

  /**
   * Extract keywords from text
   * @param text Text to extract keywords from
   * @returns Array of keywords
   */
  private extractKeywords(text: string): string[] {
    // Remove common words and extract meaningful keywords
    const commonWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'be',
      'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
      'would', 'should', 'could', 'may', 'might', 'can', 'what', 'when',
      'where', 'who', 'why', 'how', 'this', 'that', 'these', 'those'
    ]);

    const words = text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3 && !commonWords.has(word));

    // Return unique keywords
    return [...new Set(words)];
  }

  /**
   * Parse a CSV line handling quoted fields
   * @param line CSV line to parse
   * @returns Array of field values
   */
  private parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }

    result.push(current);
    return result;
  }
}
