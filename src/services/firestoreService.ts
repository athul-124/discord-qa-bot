import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { config } from '../config';
import { GuildConfig, ModerationLog, TrendLog, UsageMetrics } from '../types';

class FirestoreService {
  private db: admin.firestore.Firestore;
  private initialized = false;

  constructor() {
    if (!this.initialized) {
      this.initialize();
    }
    this.db = admin.firestore();
  }

  private initialize() {
    try {
      const serviceAccountJson = readFileSync(
        config.firebase.serviceAccountPath,
        'utf8'
      );
      const serviceAccount = JSON.parse(serviceAccountJson);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: config.firebase.projectId,
      });
      this.initialized = true;
      console.log('Firebase initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Firebase:', error);
      throw error;
    }
  }

  async getGuildConfig(guildId: string): Promise<GuildConfig> {
    const docRef = this.db.collection('guildConfigs').doc(guildId);
    const doc = await docRef.get();

    if (!doc.exists) {
      const defaultConfig: GuildConfig = {
        guildId,
        spamPatternsEnabled: true,
        customSpamPatterns: [],
        optOutSpamDeletion: false,
      };
      await docRef.set(defaultConfig);
      return defaultConfig;
    }

    return doc.data() as GuildConfig;
  }

  async updateGuildConfig(guildId: string, config: Partial<GuildConfig>): Promise<void> {
    await this.db.collection('guildConfigs').doc(guildId).update({
      ...config,
      guildId,
    });
  }

  async logModerationAction(log: ModerationLog): Promise<string> {
    const docRef = await this.db.collection('moderationLogs').add({
      ...log,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });
    return docRef.id;
  }

  async getModerationLogs(
    guildId: string,
    limit: number = 50,
    startAfter?: Date
  ): Promise<ModerationLog[]> {
    let query = this.db
      .collection('moderationLogs')
      .where('guildId', '==', guildId)
      .orderBy('timestamp', 'desc')
      .limit(limit);

    if (startAfter) {
      query = query.startAfter(startAfter);
    }

    const snapshot = await query.get();
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate(),
    })) as ModerationLog[];
  }

  async logTrend(trend: TrendLog): Promise<string> {
    const docRef = await this.db.collection('trendLogs').add({
      ...trend,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });
    return docRef.id;
  }

  async getTrendLogs(
    guildId: string,
    startDate: Date,
    endDate: Date
  ): Promise<TrendLog[]> {
    const snapshot = await this.db
      .collection('trendLogs')
      .where('guildId', '==', guildId)
      .where('timestamp', '>=', startDate)
      .where('timestamp', '<=', endDate)
      .orderBy('timestamp', 'desc')
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate(),
    })) as TrendLog[];
  }

  async updateUsageMetrics(metrics: UsageMetrics): Promise<void> {
    const docId = `${metrics.guildId}_${metrics.period}`;
    const docRef = this.db.collection('usageMetrics').doc(docId);
    const doc = await docRef.get();

    if (doc.exists) {
      await docRef.update({
        totalMessages: admin.firestore.FieldValue.increment(metrics.totalMessages),
        spamMessages: admin.firestore.FieldValue.increment(metrics.spamMessages),
        legitimateMessages: admin.firestore.FieldValue.increment(metrics.legitimateMessages),
        questionsAnswered: admin.firestore.FieldValue.increment(metrics.questionsAnswered),
        unansweredQueries: admin.firestore.FieldValue.increment(metrics.unansweredQueries),
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });
    } else {
      await docRef.set({
        ...metrics,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
  }

  async getUsageMetrics(guildId: string, period: string): Promise<UsageMetrics | null> {
    const docId = `${guildId}_${period}`;
    const doc = await this.db.collection('usageMetrics').doc(docId).get();

    if (!doc.exists) {
      return null;
    }

    return {
      ...doc.data(),
      timestamp: doc.data()?.timestamp?.toDate(),
    } as UsageMetrics;
  }

  async getAllGuildIds(): Promise<string[]> {
    const snapshot = await this.db.collection('guildConfigs').get();
    return snapshot.docs.map((doc) => doc.id);
  }
}

export const firestoreService = new FirestoreService();
