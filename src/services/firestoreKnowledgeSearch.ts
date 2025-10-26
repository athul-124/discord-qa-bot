import { Firestore } from '@google-cloud/firestore';
import { KnowledgeBaseEntry } from './knowledgeBase';

export interface SearchResult {
  entry: KnowledgeBaseEntry;
  score: number;
}

export class FirestoreKnowledgeSearchService {
  private db: Firestore;
  private collectionName: string;
  private scoreThreshold: number;
  private stopWords: Set<string>;

  constructor(db: Firestore, collectionName: string = 'kbs', scoreThreshold: number = 0.7) {
    this.db = db;
    this.collectionName = collectionName;
    this.scoreThreshold = scoreThreshold;
    
    this.stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'be',
      'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
      'would', 'should', 'could', 'may', 'might', 'can', 'what', 'when',
      'where', 'who', 'why', 'how', 'this', 'that', 'these', 'those', 'it',
      'its', 'my', 'your', 'his', 'her', 'their', 'our', 'you', 'i', 'we',
      'they', 'he', 'she', 'me', 'him', 'us', 'them'
    ]);
  }

  async search(query: string, limit: number = 3): Promise<SearchResult[]> {
    const tokens = this.tokenize(query);
    
    if (tokens.length === 0) {
      return [];
    }

    const candidates = await this.queryFirestore(tokens);
    
    const results: SearchResult[] = [];
    for (const candidate of candidates) {
      const score = this.calculateSimilarity(tokens, candidate);
      
      if (score >= this.scoreThreshold) {
        results.push({ entry: candidate, score });
      }
    }

    results.sort((a, b) => b.score - a.score);
    
    return results.slice(0, limit);
  }

  async getBestMatch(query: string): Promise<SearchResult | null> {
    const results = await this.search(query, 1);
    return results.length > 0 ? results[0] : null;
  }

  private tokenize(text: string): string[] {
    const words = text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2 && !this.stopWords.has(word));
    
    return [...new Set(words)];
  }

  private async queryFirestore(tokens: string[]): Promise<KnowledgeBaseEntry[]> {
    const batchSize = 10;
    const allResults: KnowledgeBaseEntry[] = [];
    const seenIds = new Set<string>();

    for (let i = 0; i < tokens.length; i += batchSize) {
      const batch = tokens.slice(i, i + batchSize);
      
      const querySnapshot = await this.db
        .collection(this.collectionName)
        .where('keywords', 'array-contains-any', batch)
        .limit(30)
        .get();

      querySnapshot.forEach(doc => {
        if (!seenIds.has(doc.id)) {
          seenIds.add(doc.id);
          const data = doc.data();
          allResults.push({
            question: data.question || '',
            answer: data.answer || '',
            keywords: data.keywords || [],
            category: data.category
          });
        }
      });
    }

    return allResults;
  }

  private calculateSimilarity(queryTokens: string[], entry: KnowledgeBaseEntry): number {
    const entryTokens = this.tokenize(`${entry.question} ${entry.answer}`);
    const entryKeywords = entry.keywords.map(k => k.toLowerCase());

    const querySet = new Set(queryTokens);
    const entrySet = new Set([...entryTokens, ...entryKeywords]);

    const intersection = new Set([...querySet].filter(x => entrySet.has(x)));
    const union = new Set([...querySet, ...entrySet]);

    const jaccardScore = intersection.size / union.size;

    const commonKeywords = entryKeywords.filter(k => queryTokens.some(qt => 
      k.includes(qt) || qt.includes(k)
    ));
    const keywordBonus = commonKeywords.length * 0.1;

    const questionTokens = this.tokenize(entry.question);
    const questionMatches = queryTokens.filter(qt => questionTokens.includes(qt));
    const questionBonus = (questionMatches.length / Math.max(queryTokens.length, 1)) * 0.2;

    const totalScore = Math.min(jaccardScore + keywordBonus + questionBonus, 1.0);

    return totalScore;
  }

  setThreshold(threshold: number): void {
    this.scoreThreshold = threshold;
  }

  getThreshold(): number {
    return this.scoreThreshold;
  }
}
