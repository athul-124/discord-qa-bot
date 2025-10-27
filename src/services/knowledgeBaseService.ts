import { getFirestore } from './firebaseService';
import { KnowledgeEntry } from '../types';

const BATCH_SIZE = 500;

export async function saveKnowledgeEntries(entries: KnowledgeEntry[]): Promise<number> {
  const db = getFirestore();
  let savedCount = 0;
  
  for (let i = 0; i < entries.length; i += BATCH_SIZE) {
    const batch = db.batch();
    const batchEntries = entries.slice(i, i + BATCH_SIZE);
    
    for (const entry of batchEntries) {
      const docRef = db.collection('knowledge_base').doc();
      batch.set(docRef, {
        ...entry,
        createdAt: entry.createdAt || new Date(),
      });
    }
    
    await batch.commit();
    savedCount += batchEntries.length;
  }
  
  return savedCount;
}

export async function saveIngestionMetadata(metadata: {
  serverId: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  entriesCreated: number;
  entriesSkipped: number;
  errors: any[];
  sourceFilePath: string;
  timestamp: Date;
}): Promise<void> {
  const db = getFirestore();
  await db.collection('ingestions').add(metadata);
}
