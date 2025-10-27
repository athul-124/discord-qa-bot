import { getFirestore } from './firebase';
import { UsageRecord } from '../types';

export class UsageService {
  private collection = 'usage_records';

  private get db() {
    return getFirestore();
  }

  private getCurrentMonth(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }

  async checkQuota(guildId: string): Promise<{ allowed: boolean; current: number; limit: number }> {
    try {
      const month = this.getCurrentMonth();
      const docId = `${guildId}_${month}`;
      const doc = await this.db.collection(this.collection).doc(docId).get();

      const defaultLimit = 1000;
      
      if (!doc.exists) {
        console.log(`[UsageService] No usage record for guild ${guildId} in ${month}, allowing request`);
        return { allowed: true, current: 0, limit: defaultLimit };
      }

      const data = doc.data();
      const current = data?.count || 0;
      const limit = data?.limit || defaultLimit;

      const allowed = current < limit;
      
      if (!allowed) {
        console.log(`[UsageService] Quota exceeded for guild ${guildId}: ${current}/${limit}`);
      }

      return { allowed, current, limit };
    } catch (error) {
      console.error(`[UsageService] Error checking quota for guild ${guildId}:`, error);
      return { allowed: true, current: 0, limit: 1000 };
    }
  }

  async incrementUsage(guildId: string): Promise<void> {
    try {
      const month = this.getCurrentMonth();
      const docId = `${guildId}_${month}`;
      const docRef = this.db.collection(this.collection).doc(docId);
      const doc = await docRef.get();

      if (!doc.exists) {
        await docRef.set({
          guildId,
          month,
          count: 1,
          limit: 1000,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        console.log(`[UsageService] Created usage record for guild ${guildId} in ${month}`);
      } else {
        const data = doc.data();
        const newCount = (data?.count || 0) + 1;
        await docRef.update({
          count: newCount,
          updatedAt: new Date(),
        });
        console.log(`[UsageService] Incremented usage for guild ${guildId}: ${newCount}`);
      }
    } catch (error) {
      console.error(`[UsageService] Error incrementing usage for guild ${guildId}:`, error);
    }
  }

  async getUsageStats(guildId: string): Promise<UsageRecord | null> {
    try {
      const month = this.getCurrentMonth();
      const docId = `${guildId}_${month}`;
      const doc = await this.db.collection(this.collection).doc(docId).get();

      if (!doc.exists) {
        return null;
      }

      const data = doc.data();
      return {
        guildId,
        month,
        count: data?.count || 0,
        limit: data?.limit || 1000,
      };
    } catch (error) {
      console.error(`[UsageService] Error getting usage stats for guild ${guildId}:`, error);
      return null;
    }
  }
}

export const usageService = new UsageService();
