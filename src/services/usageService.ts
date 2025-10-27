import { getFirestore } from '../config/firebase';
import { UsageEntry, usageEntryConverter, ServerTier } from '../types';

const COLLECTION_NAME = 'usage_entries';

// Tier-based monthly message limits
const TIER_LIMITS: Record<ServerTier, number> = {
  [ServerTier.FREE]: 100,
  [ServerTier.PREMIUM]: 1000,
  [ServerTier.ENTERPRISE]: 10000,
};

export interface UsageCheckResult {
  allowed: boolean;
  current: number;
  limit: number;
  tier: ServerTier;
}

export class UsageService {
  private db = getFirestore();

  /**
   * Get current month key in YYYY-MM format
   */
  private getCurrentMonthKey(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }

  /**
   * Get month key for a specific date
   */
  private getMonthKey(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }

  /**
   * Get tier limit for a server
   */
  private getTierLimit(tier: ServerTier): number {
    return TIER_LIMITS[tier] || TIER_LIMITS[ServerTier.FREE];
  }

  /**
   * Check if a server can send more messages based on tier limits
   */
  async checkTierLimits(serverId: string, tier: ServerTier): Promise<UsageCheckResult> {
    try {
      const monthKey = this.getCurrentMonthKey();
      const limit = this.getTierLimit(tier);

      const snapshot = await this.db
        .collection(COLLECTION_NAME)
        .where('serverId', '==', serverId)
        .where('monthKey', '==', monthKey)
        .limit(1)
        .get();

      if (snapshot.empty) {
        console.log(`[Usage] No usage record for server ${serverId} in ${monthKey}`);
        return { allowed: true, current: 0, limit, tier };
      }

      const entry = usageEntryConverter.fromFirestore(snapshot.docs[0] as any);
      const allowed = entry.messageCount < limit;

      if (!allowed) {
        console.log(`[Usage] Tier limit exceeded for server ${serverId}: ${entry.messageCount}/${limit}`);
      }

      return { allowed, current: entry.messageCount, limit, tier };
    } catch (error) {
      console.error(`[Usage] Error checking tier limits for server ${serverId}:`, error);
      // Allow by default on error
      return { allowed: true, current: 0, limit: this.getTierLimit(tier), tier };
    }
  }

  /**
   * Increment usage count for a server
   */
  async incrementUsage(serverId: string): Promise<void> {
    try {
      const monthKey = this.getCurrentMonthKey();

      const snapshot = await this.db
        .collection(COLLECTION_NAME)
        .where('serverId', '==', serverId)
        .where('monthKey', '==', monthKey)
        .limit(1)
        .get();

      const now = new Date();

      if (snapshot.empty) {
        // Create new usage entry
        const newEntry: UsageEntry = {
          serverId,
          monthKey,
          messageCount: 1,
          lastMessageAt: now,
          createdAt: now,
        };

        const docRef = this.db.collection(COLLECTION_NAME).doc();
        await docRef.set(usageEntryConverter.toFirestore(newEntry as any));

        console.log(`[Usage] Created usage record for server ${serverId} in ${monthKey}`);
      } else {
        // Update existing entry
        const docRef = snapshot.docs[0].ref;
        const currentData = usageEntryConverter.fromFirestore(snapshot.docs[0] as any);

        await docRef.update({
          messageCount: currentData.messageCount + 1,
          lastMessageAt: now,
        });

        console.log(`[Usage] Incremented usage for server ${serverId}: ${currentData.messageCount + 1}`);
      }
    } catch (error) {
      console.error(`[Usage] Error incrementing usage for server ${serverId}:`, error);
      throw error;
    }
  }

  /**
   * Get usage statistics for a server in a specific month
   */
  async getUsageStats(serverId: string, monthKey?: string): Promise<UsageEntry | null> {
    try {
      const targetMonth = monthKey || this.getCurrentMonthKey();

      const snapshot = await this.db
        .collection(COLLECTION_NAME)
        .where('serverId', '==', serverId)
        .where('monthKey', '==', targetMonth)
        .limit(1)
        .get();

      if (snapshot.empty) {
        console.log(`[Usage] No usage stats for server ${serverId} in ${targetMonth}`);
        return null;
      }

      const entry = usageEntryConverter.fromFirestore(snapshot.docs[0] as any);
      return entry;
    } catch (error) {
      console.error(`[Usage] Error getting usage stats for server ${serverId}:`, error);
      return null;
    }
  }

  /**
   * Get usage history for a server across multiple months
   */
  async getUsageHistory(serverId: string, months: number = 6): Promise<UsageEntry[]> {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - months);

      const startMonthKey = this.getMonthKey(startDate);

      const snapshot = await this.db
        .collection(COLLECTION_NAME)
        .where('serverId', '==', serverId)
        .where('monthKey', '>=', startMonthKey)
        .orderBy('monthKey', 'desc')
        .get();

      const history = snapshot.docs.map((doc) => 
        usageEntryConverter.fromFirestore(doc as any)
      );

      console.log(`[Usage] Retrieved ${history.length} months of history for server ${serverId}`);
      return history;
    } catch (error) {
      console.error(`[Usage] Error getting usage history for server ${serverId}:`, error);
      return [];
    }
  }

  /**
   * Reset usage for a server (useful for testing or manual resets)
   */
  async resetUsage(serverId: string, monthKey?: string): Promise<void> {
    try {
      const targetMonth = monthKey || this.getCurrentMonthKey();

      const snapshot = await this.db
        .collection(COLLECTION_NAME)
        .where('serverId', '==', serverId)
        .where('monthKey', '==', targetMonth)
        .get();

      if (snapshot.empty) {
        console.log(`[Usage] No usage to reset for server ${serverId} in ${targetMonth}`);
        return;
      }

      const batch = this.db.batch();
      snapshot.docs.forEach((doc) => batch.delete(doc.ref));
      await batch.commit();

      console.log(`[Usage] Reset usage for server ${serverId} in ${targetMonth}`);
    } catch (error) {
      console.error(`[Usage] Error resetting usage for server ${serverId}:`, error);
      throw error;
    }
  }

  /**
   * Automated monthly reset logic
   * This should be called by a cron job at the start of each month
   */
  async performMonthlyReset(dryRun: boolean = false): Promise<number> {
    try {
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      const lastMonthKey = this.getMonthKey(lastMonth);

      console.log(`[Usage] ${dryRun ? 'Dry run' : 'Performing'} monthly reset for ${lastMonthKey}`);

      const snapshot = await this.db
        .collection(COLLECTION_NAME)
        .where('monthKey', '==', lastMonthKey)
        .get();

      if (snapshot.empty) {
        console.log(`[Usage] No usage records to archive for ${lastMonthKey}`);
        return 0;
      }

      if (dryRun) {
        console.log(`[Usage] Would reset ${snapshot.docs.length} usage records`);
        return snapshot.docs.length;
      }

      // Note: In production, you might want to archive this data instead of deleting
      // For now, we just log that a reset would happen
      // The usage entries will naturally become stale as new months are created

      console.log(`[Usage] Found ${snapshot.docs.length} usage records for ${lastMonthKey} (kept for historical data)`);
      return snapshot.docs.length;
    } catch (error) {
      console.error('[Usage] Error performing monthly reset:', error);
      throw error;
    }
  }

  /**
   * Get total usage across all servers for a month
   */
  async getTotalUsage(monthKey?: string): Promise<number> {
    try {
      const targetMonth = monthKey || this.getCurrentMonthKey();

      const snapshot = await this.db
        .collection(COLLECTION_NAME)
        .where('monthKey', '==', targetMonth)
        .get();

      const total = snapshot.docs.reduce((sum, doc) => {
        const entry = usageEntryConverter.fromFirestore(doc as any);
        return sum + entry.messageCount;
      }, 0);

      console.log(`[Usage] Total usage for ${targetMonth}: ${total} messages`);
      return total;
    } catch (error) {
      console.error('[Usage] Error getting total usage:', error);
      return 0;
    }
  }

  /**
   * Check if a server has reached its limit
   */
  async hasReachedLimit(serverId: string, tier: ServerTier): Promise<boolean> {
    const result = await this.checkTierLimits(serverId, tier);
    return !result.allowed;
  }
}

export const usageService = new UsageService();

// Legacy compatibility exports
export class UsageServiceLegacy {
  private usageService = new UsageService();
  private collection = 'usage_records';

  private getCurrentMonth(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }

  async checkQuota(guildId: string): Promise<{ allowed: boolean; current: number; limit: number }> {
    const result = await this.usageService.checkTierLimits(guildId, ServerTier.FREE);
    return {
      allowed: result.allowed,
      current: result.current,
      limit: result.limit,
    };
  }

  async incrementUsage(guildId: string): Promise<void> {
    await this.usageService.incrementUsage(guildId);
  }

  async getUsageStats(guildId: string) {
    const stats = await this.usageService.getUsageStats(guildId);
    if (!stats) {
      return null;
    }
    return {
      guildId: stats.serverId,
      month: stats.monthKey,
      count: stats.messageCount,
      limit: TIER_LIMITS[ServerTier.FREE],
    };
  }
}

export const usageServiceLegacy = new UsageServiceLegacy();
