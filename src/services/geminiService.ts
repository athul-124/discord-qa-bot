import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold, GenerativeModel } from '@google/generative-ai';
import { SearchResult } from './firestoreKnowledgeSearch';
import { Firestore } from '@google-cloud/firestore';

interface RateLimitData {
  date: string;
  count: number;
}

interface QueuedRequest {
  resolve: (value: string) => void;
  reject: (error: Error) => void;
  query: string;
  kbContext: SearchResult[];
}

export class GeminiService {
  private genAI: GoogleGenerativeAI;
  private model: GenerativeModel;
  private db: Firestore;
  private dailyLimit: number = 500;
  private rateLimitCollection: string = 'gemini_rate_limits';
  private requestQueue: QueuedRequest[] = [];
  private adminUserId?: string;

  constructor(apiKey: string, db: Firestore, adminUserId?: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.db = db;
    this.adminUserId = adminUserId;
    
    this.model = this.genAI.getGenerativeModel({
      model: 'gemini-2.0-flash-exp',
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
      ],
    });
  }

  async generateResponse(query: string, kbMatches: SearchResult[], timeoutMs: number = 5000): Promise<string> {
    if (kbMatches.length === 0) {
      return this.getFallbackResponse();
    }

    const canMakeRequest = await this.checkRateLimit();
    
    if (!canMakeRequest) {
      console.warn('Rate limit exceeded, queueing request');
      return this.queueRequest(query, kbMatches);
    }

    try {
      const response = await Promise.race([
        this.callGemini(query, kbMatches),
        this.timeout(timeoutMs, kbMatches)
      ]);

      await this.incrementRateLimit();
      return response;
    } catch (error) {
      console.error('Gemini API error:', error);
      return this.getFallbackFromKB(kbMatches);
    }
  }

  private async callGemini(query: string, kbMatches: SearchResult[]): Promise<string> {
    const prompt = this.buildPrompt(query, kbMatches);
    
    const result = await this.model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    
    return this.sanitizeForDiscord(text);
  }

  private buildPrompt(query: string, kbMatches: SearchResult[]): string {
    const kbContext = kbMatches.map((match, idx) => {
      return `[${idx + 1}] Q: ${match.entry.question}\nA: ${match.entry.answer}`;
    }).join('\n\n');

    return `You are a helpful assistant answering questions based on a knowledge base. Follow these rules strictly:
1. Answer the question concisely (2-3 sentences max) using ONLY information from the provided KB entries below.
2. If the KB entries don't contain enough information to answer the question, say "I don't have enough information about that in my knowledge base."
3. Do NOT make up or infer information that isn't explicitly in the KB entries.
4. Cite the KB entry numbers in your response (e.g., [1], [2]).
5. Be direct and helpful.

Question: ${query}

Knowledge Base Entries:
${kbContext}

Answer:`;
  }

  private sanitizeForDiscord(text: string): string {
    text = text.replace(/```/g, '\\`\\`\\`');
    
    if (text.length > 2000) {
      text = text.substring(0, 1997) + '...';
    }
    
    return text.trim();
  }

  private getFallbackFromKB(kbMatches: SearchResult[]): string {
    if (kbMatches.length === 0) {
      return this.getFallbackResponse();
    }

    const topMatch = kbMatches[0];
    return `Based on my knowledge base [1]:\n\n${topMatch.entry.answer}\n\n${this.getCitations(kbMatches)}`;
  }

  private getCitations(kbMatches: SearchResult[]): string {
    const citations = kbMatches.map((match, idx) => {
      return `[${idx + 1}] ${match.entry.question} (confidence: ${(match.score * 100).toFixed(1)}%)`;
    }).join('\n');

    return `\n**References:**\n${citations}`;
  }

  private getFallbackResponse(): string {
    return "I couldn't find relevant information in my knowledge base to answer your question. Please try rephrasing or ask something else.";
  }

  private async timeout(ms: number, kbMatches: SearchResult[]): Promise<string> {
    return new Promise((resolve) => {
      setTimeout(() => {
        console.warn(`Gemini request timed out after ${ms}ms, using fallback`);
        resolve(this.getFallbackFromKB(kbMatches));
      }, ms);
    });
  }

  private async checkRateLimit(): Promise<boolean> {
    const today = this.getTodayString();
    const docRef = this.db.collection(this.rateLimitCollection).doc(today);
    const doc = await docRef.get();

    if (!doc.exists) {
      return true;
    }

    const data = doc.data() as RateLimitData;
    const remaining = this.dailyLimit - (data.count || 0);

    if (remaining <= 50 && remaining > 0 && this.adminUserId) {
      console.warn(`Gemini API usage warning: ${remaining} requests remaining today`);
    }

    return data.count < this.dailyLimit;
  }

  private async incrementRateLimit(): Promise<void> {
    const today = this.getTodayString();
    const docRef = this.db.collection(this.rateLimitCollection).doc(today);
    
    const doc = await docRef.get();
    
    if (!doc.exists) {
      await docRef.set({
        date: today,
        count: 1
      });
    } else {
      await docRef.update({
        count: (doc.data()!.count || 0) + 1
      });
    }
  }

  private getTodayString(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }

  private queueRequest(query: string, kbContext: SearchResult[]): Promise<string> {
    return new Promise((resolve, reject) => {
      this.requestQueue.push({ resolve, reject, query, kbContext });
      
      console.log(`Request queued. Queue size: ${this.requestQueue.length}`);
      
      setTimeout(() => {
        resolve(this.getFallbackFromKB(kbContext));
      }, 10000);
    });
  }

  async processQueue(): Promise<void> {
    while (this.requestQueue.length > 0) {
      const canMakeRequest = await this.checkRateLimit();
      
      if (!canMakeRequest) {
        console.log('Still rate limited, will retry queue later');
        break;
      }

      const request = this.requestQueue.shift();
      if (request) {
        try {
          const response = await this.callGemini(request.query, request.kbContext);
          await this.incrementRateLimit();
          request.resolve(response);
        } catch (error) {
          const fallback = this.getFallbackFromKB(request.kbContext);
          request.resolve(fallback);
        }
      }
    }
  }

  async getRemainingRequests(): Promise<number> {
    const today = this.getTodayString();
    const docRef = this.db.collection(this.rateLimitCollection).doc(today);
    const doc = await docRef.get();

    if (!doc.exists) {
      return this.dailyLimit;
    }

    const data = doc.data() as RateLimitData;
    return Math.max(0, this.dailyLimit - (data.count || 0));
  }
}
