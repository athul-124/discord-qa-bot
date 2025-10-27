import { getFirestore, getStorage } from '../config/firebase';
import { KnowledgeEntry, knowledgeEntryConverter } from '../types';

const COLLECTION_NAME = 'knowledge_entries';
const BATCH_SIZE_LIMIT = 500;

export class KnowledgeBaseService {
  private db = getFirestore();
  private storage = getStorage();

  /**
   * Save a single knowledge entry
   */
  async saveKnowledgeEntry(entry: KnowledgeEntry): Promise<string> {
    try {
      const docRef = this.db
        .collection(COLLECTION_NAME)
        .withConverter(knowledgeEntryConverter);

      const result = await docRef.add({
        ...entry,
        createdAt: new Date(),
      });

      console.log(`[KnowledgeBase] Saved entry ${result.id} for server ${entry.serverId}`);
      return result.id;
    } catch (error) {
      console.error('[KnowledgeBase] Error saving entry:', error);
      throw error;
    }
  }

  /**
   * Batch save multiple knowledge entries with automatic chunking
   * Respects Firestore's 500 operation limit per batch
   */
  async saveKnowledgeEntries(entries: KnowledgeEntry[]): Promise<string[]> {
    if (entries.length === 0) {
      return [];
    }

    try {
      const ids: string[] = [];
      const chunks = this.chunkArray(entries, BATCH_SIZE_LIMIT);

      for (const chunk of chunks) {
        const batch = this.db.batch();
        const chunkIds: string[] = [];

        for (const entry of chunk) {
          const docRef = this.db.collection(COLLECTION_NAME).doc();
          chunkIds.push(docRef.id);

          batch.set(docRef, knowledgeEntryConverter.toFirestore({
            ...entry,
            createdAt: new Date(),
          } as any));
        }

        await batch.commit();
        ids.push(...chunkIds);
        console.log(`[KnowledgeBase] Batch saved ${chunk.length} entries`);
      }

      console.log(`[KnowledgeBase] Total saved ${ids.length} entries for server ${entries[0].serverId}`);
      return ids;
    } catch (error) {
      console.error('[KnowledgeBase] Error batch saving entries:', error);
      throw error;
    }
  }

  /**
   * Update an existing knowledge entry
   */
  async updateKnowledgeEntry(id: string, updates: Partial<KnowledgeEntry>): Promise<void> {
    try {
      const docRef = this.db.collection(COLLECTION_NAME).doc(id);
      
      await docRef.update({
        ...updates,
        updatedAt: new Date(),
      });

      console.log(`[KnowledgeBase] Updated entry ${id}`);
    } catch (error) {
      console.error(`[KnowledgeBase] Error updating entry ${id}:`, error);
      throw error;
    }
  }

  /**
   * Batch update multiple knowledge entries with automatic chunking
   */
  async updateKnowledgeEntries(updates: Array<{ id: string; data: Partial<KnowledgeEntry> }>): Promise<void> {
    if (updates.length === 0) {
      return;
    }

    try {
      const chunks = this.chunkArray(updates, BATCH_SIZE_LIMIT);

      for (const chunk of chunks) {
        const batch = this.db.batch();

        for (const { id, data } of chunk) {
          const docRef = this.db.collection(COLLECTION_NAME).doc(id);
          batch.update(docRef, {
            ...data,
            updatedAt: new Date(),
          });
        }

        await batch.commit();
        console.log(`[KnowledgeBase] Batch updated ${chunk.length} entries`);
      }

      console.log(`[KnowledgeBase] Total updated ${updates.length} entries`);
    } catch (error) {
      console.error('[KnowledgeBase] Error batch updating entries:', error);
      throw error;
    }
  }

  /**
   * Search knowledge entries by keywords for a specific server
   * Returns entries sorted by relevance (number of matching keywords)
   */
  async getTopMatches(serverId: string, keywords: string[], limit: number = 5): Promise<KnowledgeEntry[]> {
    try {
      const snapshot = await this.db
        .collection(COLLECTION_NAME)
        .where('serverId', '==', serverId)
        .where('keywords', 'array-contains-any', keywords.slice(0, 10)) // Firestore limit
        .limit(limit * 2) // Get more to allow for relevance sorting
        .get();

      const entries = snapshot.docs.map((doc) => 
        knowledgeEntryConverter.fromFirestore(doc as any)
      );

      // Calculate relevance scores
      const scored = entries.map((entry) => {
        const matchCount = keywords.filter((kw) => 
          entry.keywords.some((entryKw) => 
            entryKw.toLowerCase().includes(kw.toLowerCase()) ||
            kw.toLowerCase().includes(entryKw.toLowerCase())
          )
        ).length;

        return { entry, score: matchCount };
      });

      // Sort by score and return top matches
      const sorted = scored
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map((s) => s.entry);

      console.log(`[KnowledgeBase] Found ${sorted.length} matches for server ${serverId}`);
      return sorted;
    } catch (error) {
      console.error('[KnowledgeBase] Error searching entries:', error);
      return [];
    }
  }

  /**
   * Get all knowledge entries for a server
   */
  async getServerEntries(serverId: string, limit?: number): Promise<KnowledgeEntry[]> {
    try {
      let query = this.db
        .collection(COLLECTION_NAME)
        .where('serverId', '==', serverId)
        .orderBy('createdAt', 'desc');

      if (limit) {
        query = query.limit(limit) as any;
      }

      const snapshot = await query.get();
      const entries = snapshot.docs.map((doc) => 
        knowledgeEntryConverter.fromFirestore(doc as any)
      );

      console.log(`[KnowledgeBase] Retrieved ${entries.length} entries for server ${serverId}`);
      return entries;
    } catch (error) {
      console.error(`[KnowledgeBase] Error getting entries for server ${serverId}:`, error);
      return [];
    }
  }

  /**
   * Delete a knowledge entry
   */
  async deleteKnowledgeEntry(id: string): Promise<void> {
    try {
      await this.db.collection(COLLECTION_NAME).doc(id).delete();
      console.log(`[KnowledgeBase] Deleted entry ${id}`);
    } catch (error) {
      console.error(`[KnowledgeBase] Error deleting entry ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete all knowledge entries for a server
   */
  async deleteServerEntries(serverId: string): Promise<number> {
    try {
      const snapshot = await this.db
        .collection(COLLECTION_NAME)
        .where('serverId', '==', serverId)
        .get();

      if (snapshot.empty) {
        console.log(`[KnowledgeBase] No entries to delete for server ${serverId}`);
        return 0;
      }

      const chunks = this.chunkArray(snapshot.docs, BATCH_SIZE_LIMIT);
      let totalDeleted = 0;

      for (const chunk of chunks) {
        const batch = this.db.batch();
        chunk.forEach((doc) => batch.delete(doc.ref));
        await batch.commit();
        totalDeleted += chunk.length;
      }

      console.log(`[KnowledgeBase] Deleted ${totalDeleted} entries for server ${serverId}`);
      return totalDeleted;
    } catch (error) {
      console.error(`[KnowledgeBase] Error deleting entries for server ${serverId}:`, error);
      throw error;
    }
  }

  /**
   * Extract keywords from text for indexing
   * Simple implementation - can be enhanced with NLP
   */
  extractKeywords(text: string, maxKeywords: number = 20): string[] {
    // Convert to lowercase and split into words
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter((word) => word.length > 3); // Filter out short words

    // Remove common stop words
    const stopWords = new Set([
      'this', 'that', 'these', 'those', 'what', 'which', 'who', 'when', 'where',
      'why', 'how', 'with', 'from', 'have', 'been', 'would', 'could', 'should',
      'will', 'about', 'there', 'their', 'they', 'them', 'then', 'than',
    ]);

    const filtered = words.filter((word) => !stopWords.has(word));

    // Get unique words and limit count
    const unique = Array.from(new Set(filtered));
    return unique.slice(0, maxKeywords);
  }

  /**
   * Store raw artifact metadata in Cloud Storage
   * Useful for storing original files that knowledge entries were extracted from
   */
  async storeArtifactMetadata(serverId: string, fileName: string, content: Buffer): Promise<string> {
    try {
      const bucket = this.storage.bucket();
      const filePath = `artifacts/${serverId}/${Date.now()}_${fileName}`;
      const file = bucket.file(filePath);

      await file.save(content, {
        metadata: {
          contentType: 'application/octet-stream',
          metadata: {
            serverId,
            uploadedAt: new Date().toISOString(),
          },
        },
      });

      console.log(`[KnowledgeBase] Stored artifact at ${filePath}`);
      return filePath;
    } catch (error) {
      console.error('[KnowledgeBase] Error storing artifact:', error);
      throw error;
    }
  }

  /**
   * Get artifact metadata from Cloud Storage
   */
  async getArtifactMetadata(filePath: string): Promise<Buffer> {
    try {
      const bucket = this.storage.bucket();
      const file = bucket.file(filePath);
      const [content] = await file.download();

      console.log(`[KnowledgeBase] Retrieved artifact from ${filePath}`);
      return content;
    } catch (error) {
      console.error(`[KnowledgeBase] Error retrieving artifact ${filePath}:`, error);
      throw error;
    }
  }

  /**
   * Utility: Chunk array into smaller arrays
   */
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
}

export const knowledgeBaseService = new KnowledgeBaseService();
