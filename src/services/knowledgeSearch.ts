import { KnowledgeBaseEntry } from './knowledgeBase';

export interface SearchResult {
  entry: KnowledgeBaseEntry;
  score: number;
}

export class KnowledgeSearchService {
  private knowledgeBase: KnowledgeBaseEntry[];
  private scoreThreshold: number;

  constructor(knowledgeBase: KnowledgeBaseEntry[], scoreThreshold: number = 0.3) {
    this.knowledgeBase = knowledgeBase;
    this.scoreThreshold = scoreThreshold;
  }

  /**
   * Search knowledge base for relevant entries
   * @param query User query
   * @returns Sorted array of search results above threshold
   */
  search(query: string): SearchResult[] {
    const queryWords = this.tokenize(query);
    const results: SearchResult[] = [];

    for (const entry of this.knowledgeBase) {
      const score = this.calculateScore(queryWords, entry);
      
      if (score >= this.scoreThreshold) {
        results.push({ entry, score });
      }
    }

    // Sort by score descending
    results.sort((a, b) => b.score - a.score);

    return results;
  }

  /**
   * Get the best matching entry
   * @param query User query
   * @returns Best matching entry or null if none above threshold
   */
  getBestMatch(query: string): SearchResult | null {
    const results = this.search(query);
    return results.length > 0 ? results[0] : null;
  }

  /**
   * Calculate relevance score for an entry
   * @param queryWords Tokenized query words
   * @param entry Knowledge base entry
   * @returns Relevance score between 0 and 1
   */
  private calculateScore(queryWords: string[], entry: KnowledgeBaseEntry): number {
    if (queryWords.length === 0) {
      return 0;
    }

    let score = 0;
    const entryText = `${entry.question} ${entry.answer}`.toLowerCase();
    const entryWords = this.tokenize(entryText);

    // Exact question match gets highest score
    const queryStr = queryWords.join(' ');
    const questionStr = this.tokenize(entry.question.toLowerCase()).join(' ');
    if (queryStr === questionStr) {
      return 1.0;
    }

    // Partial question match
    if (entryText.includes(queryStr)) {
      score += 0.5;
    }

    // Keyword matching
    const matchedKeywords = entry.keywords.filter(keyword => 
      queryWords.some(word => word.includes(keyword) || keyword.includes(word))
    );
    score += (matchedKeywords.length / Math.max(entry.keywords.length, 1)) * 0.3;

    // Word overlap
    const commonWords = queryWords.filter(word => entryWords.includes(word));
    score += (commonWords.length / Math.max(queryWords.length, 1)) * 0.2;

    return Math.min(score, 1.0);
  }

  /**
   * Tokenize text into words
   * @param text Text to tokenize
   * @returns Array of lowercase words
   */
  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 0);
  }

  /**
   * Update score threshold
   * @param threshold New threshold value
   */
  setThreshold(threshold: number): void {
    this.scoreThreshold = threshold;
  }

  /**
   * Get current threshold
   * @returns Current threshold value
   */
  getThreshold(): number {
    return this.scoreThreshold;
  }
}
