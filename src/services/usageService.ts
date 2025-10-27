import { Firestore, FieldValue } from '@google-cloud/firestore';

export interface UsageData {
  userId: string;
  messageCount: number;
  monthlyLimit: number;
  resetDate: Date;
  tier: 'free' | 'pro';
}

export class UsageService {
  private db: Firestore;
  private collectionName: string;

  constructor(db: Firestore, collectionName: string = 'usage') {
    this.db = db;
    this.collectionName = collectionName;
  }

  /**
   * Get usage data for a user
   * @param userId User ID
   * @returns Usage data or null if not found
   */
  async getUsage(userId: string): Promise<UsageData | null> {
    const docRef = this.db.collection(this.collectionName).doc(userId);
    const doc = await docRef.get();

    if (!doc.exists) {
      return null;
    }

    const data = doc.data()!;
    return {
      userId,
      messageCount: data.messageCount || 0,
      monthlyLimit: data.monthlyLimit || 100,
      resetDate: data.resetDate?.toDate() || new Date(),
      tier: data.tier || 'free'
    };
  }

  /**
   * Initialize usage data for a new user
   * @param userId User ID
   * @param tier User tier
   */
  async initializeUsage(userId: string, tier: 'free' | 'pro' = 'free'): Promise<void> {
    const monthlyLimit = tier === 'pro' ? 999999 : 100;
    const resetDate = this.calculateNextResetDate();

    await this.db.collection(this.collectionName).doc(userId).set({
      messageCount: 0,
      monthlyLimit,
      resetDate,
      tier
    });
  }

  /**
   * Check if user can send a message
   * @param userId User ID
   * @returns True if user is within limits
   */
  async canSendMessage(userId: string): Promise<boolean> {
    let usage = await this.getUsage(userId);

    // Initialize if not exists
    if (!usage) {
      await this.initializeUsage(userId);
      return true;
    }

    // Check if reset needed
    if (new Date() >= usage.resetDate) {
      await this.resetUsage(userId);
      usage = await this.getUsage(userId);
      if (!usage) return false;
    }

    return usage.messageCount < usage.monthlyLimit;
  }

  /**
   * Increment message count for a user
   * @param userId User ID
   * @returns Updated usage data
   */
  async incrementUsage(userId: string): Promise<UsageData | null> {
    const docRef = this.db.collection(this.collectionName).doc(userId);
    
    await docRef.update({
      messageCount: FieldValue.increment(1)
    });

    return this.getUsage(userId);
  }

  /**
   * Reset usage count for a user
   * @param userId User ID
   */
  async resetUsage(userId: string): Promise<void> {
    const usage = await this.getUsage(userId);
    if (!usage) return;

    const resetDate = this.calculateNextResetDate();

    await this.db.collection(this.collectionName).doc(userId).update({
      messageCount: 0,
      resetDate
    });
  }

  /**
   * Update user tier
   * @param userId User ID
   * @param tier New tier
   */
  async updateTier(userId: string, tier: 'free' | 'pro'): Promise<void> {
    const monthlyLimit = tier === 'pro' ? 999999 : 100;

    await this.db.collection(this.collectionName).doc(userId).update({
      tier,
      monthlyLimit
    });
  }

  /**
   * Calculate next reset date (first day of next month)
   * @returns Next reset date
   */
  private calculateNextResetDate(): Date {
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return nextMonth;
  }

  /**
   * Get remaining messages for a user
   * @param userId User ID
   * @returns Number of remaining messages
   */
  async getRemainingMessages(userId: string): Promise<number> {
    const usage = await this.getUsage(userId);
    if (!usage) return 0;

    return Math.max(0, usage.monthlyLimit - usage.messageCount);
  }
}

export interface UsageCheckResult {
  allowed: boolean;
  current: number;
  limit: number;
}

export class UsageServiceLegacy {
  private usageData: Map<string, { count: number; resetDate: Date }>;

  constructor() {
    this.usageData = new Map();
  }

  async checkQuota(guildId: string): Promise<UsageCheckResult> {
    const now = new Date();
    const data = this.usageData.get(guildId);

    if (!data || now >= data.resetDate) {
      this.usageData.set(guildId, {
        count: 0,
        resetDate: this.getNextResetDate(now),
      });
      return {
        allowed: true,
        current: 0,
        limit: 100,
      };
    }

    const allowed = data.count < 100;
    
    if (allowed) {
      data.count++;
      this.usageData.set(guildId, data);
    }

    return {
      allowed,
      current: data.count,
      limit: 100,
    };
  }

  private getNextResetDate(date: Date): Date {
    const next = new Date(date);
    next.setMonth(next.getMonth() + 1);
    next.setDate(1);
    next.setHours(0, 0, 0, 0);
    return next;
  }
}

export const usageServiceLegacy = new UsageServiceLegacy();

class InMemoryUsageService {
  private usageData: Map<string, { messageCount: number; limitReached: boolean }>;

  constructor() {
    this.usageData = new Map();
  }

  hasReachedLimit(serverId: string): boolean {
    const data = this.usageData.get(serverId);
    return data ? data.messageCount >= 100 : false;
  }

  incrementUsage(serverId: string): void {
    const data = this.usageData.get(serverId) || { messageCount: 0, limitReached: false };
    data.messageCount++;
    if (data.messageCount >= 100) {
      data.limitReached = true;
    }
    this.usageData.set(serverId, data);
  }

  getUsage(serverId: string): { messageCount: number; limitReached: boolean } {
    return this.usageData.get(serverId) || { messageCount: 0, limitReached: false };
  }
}

export const usageService = new InMemoryUsageService();
