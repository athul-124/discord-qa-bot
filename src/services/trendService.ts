import { getFirestore } from '../config/firebase';
import { TrendEntry, trendEntryConverter } from '../types';

const COLLECTION_NAME = 'trend_entries';

export interface TrendStats {
  topKeywords: Array<{ keyword: string; count: number }>;
  totalEngagement: number;
  messageCount: number;
  averageEngagement: number;
}

export interface TrendQuery {
  serverId: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}

export class TrendService {
  private db = getFirestore();

  /**
   * Record a trend entry for a processed message
   */
  async recordTrend(entry: TrendEntry): Promise<string> {
    try {
      const docRef = this.db
        .collection(COLLECTION_NAME)
        .withConverter(trendEntryConverter);

      const result = await docRef.add({
        ...entry,
        timestamp: entry.timestamp || new Date(),
      });

      console.log(`[Trend] Recorded trend ${result.id} for server ${entry.serverId}`);
      return result.id;
    } catch (error) {
      console.error('[Trend] Error recording trend:', error);
      throw error;
    }
  }

  /**
   * Record multiple trend entries in batch
   */
  async recordTrends(entries: TrendEntry[]): Promise<string[]> {
    if (entries.length === 0) {
      return [];
    }

    try {
      const batch = this.db.batch();
      const ids: string[] = [];

      for (const entry of entries) {
        const docRef = this.db.collection(COLLECTION_NAME).doc();
        ids.push(docRef.id);

        batch.set(docRef, trendEntryConverter.toFirestore({
          ...entry,
          timestamp: entry.timestamp || new Date(),
        } as any));
      }

      await batch.commit();
      console.log(`[Trend] Batch recorded ${entries.length} trends`);
      return ids;
    } catch (error) {
      console.error('[Trend] Error batch recording trends:', error);
      throw error;
    }
  }

  /**
   * Get trend entries for a server with optional date filtering
   */
  async getTrends(query: TrendQuery): Promise<TrendEntry[]> {
    try {
      let firestoreQuery = this.db
        .collection(COLLECTION_NAME)
        .where('serverId', '==', query.serverId)
        .orderBy('timestamp', 'desc');

      if (query.startDate) {
        firestoreQuery = firestoreQuery.where('timestamp', '>=', query.startDate) as any;
      }

      if (query.endDate) {
        firestoreQuery = firestoreQuery.where('timestamp', '<=', query.endDate) as any;
      }

      if (query.limit) {
        firestoreQuery = firestoreQuery.limit(query.limit) as any;
      }

      const snapshot = await firestoreQuery.get();
      const entries = snapshot.docs.map((doc) => 
        trendEntryConverter.fromFirestore(doc as any)
      );

      console.log(`[Trend] Retrieved ${entries.length} trends for server ${query.serverId}`);
      return entries;
    } catch (error) {
      console.error('[Trend] Error getting trends:', error);
      return [];
    }
  }

  /**
   * Get aggregated trend statistics for a server
   */
  async getTrendStats(query: TrendQuery): Promise<TrendStats> {
    try {
      const trends = await this.getTrends(query);

      if (trends.length === 0) {
        return {
          topKeywords: [],
          totalEngagement: 0,
          messageCount: 0,
          averageEngagement: 0,
        };
      }

      // Aggregate keywords
      const keywordCounts = new Map<string, number>();
      let totalEngagement = 0;

      for (const trend of trends) {
        totalEngagement += trend.engagement;

        for (const keyword of trend.keywords) {
          const normalized = keyword.toLowerCase();
          keywordCounts.set(normalized, (keywordCounts.get(normalized) || 0) + 1);
        }
      }

      // Sort keywords by count
      const topKeywords = Array.from(keywordCounts.entries())
        .map(([keyword, count]) => ({ keyword, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 20);

      const stats: TrendStats = {
        topKeywords,
        totalEngagement,
        messageCount: trends.length,
        averageEngagement: trends.length > 0 ? totalEngagement / trends.length : 0,
      };

      console.log(`[Trend] Calculated stats for server ${query.serverId}: ${trends.length} messages`);
      return stats;
    } catch (error) {
      console.error('[Trend] Error calculating stats:', error);
      return {
        topKeywords: [],
        totalEngagement: 0,
        messageCount: 0,
        averageEngagement: 0,
      };
    }
  }

  /**
   * Get trending keywords for a time period
   */
  async getTrendingKeywords(
    serverId: string,
    days: number = 7,
    limit: number = 10
  ): Promise<Array<{ keyword: string; count: number; avgEngagement: number }>> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const trends = await this.getTrends({ serverId, startDate });

      // Aggregate keywords with engagement
      const keywordData = new Map<string, { count: number; totalEngagement: number }>();

      for (const trend of trends) {
        for (const keyword of trend.keywords) {
          const normalized = keyword.toLowerCase();
          const existing = keywordData.get(normalized) || { count: 0, totalEngagement: 0 };
          
          keywordData.set(normalized, {
            count: existing.count + 1,
            totalEngagement: existing.totalEngagement + trend.engagement,
          });
        }
      }

      // Calculate averages and sort
      const trending = Array.from(keywordData.entries())
        .map(([keyword, data]) => ({
          keyword,
          count: data.count,
          avgEngagement: data.count > 0 ? data.totalEngagement / data.count : 0,
        }))
        .sort((a, b) => {
          // Sort by count first, then by average engagement
          if (b.count !== a.count) {
            return b.count - a.count;
          }
          return b.avgEngagement - a.avgEngagement;
        })
        .slice(0, limit);

      console.log(`[Trend] Found ${trending.length} trending keywords for server ${serverId}`);
      return trending;
    } catch (error) {
      console.error('[Trend] Error getting trending keywords:', error);
      return [];
    }
  }

  /**
   * Delete trend entries older than a specified date
   */
  async cleanupOldTrends(serverId: string, olderThan: Date): Promise<number> {
    try {
      const snapshot = await this.db
        .collection(COLLECTION_NAME)
        .where('serverId', '==', serverId)
        .where('timestamp', '<', olderThan)
        .get();

      if (snapshot.empty) {
        console.log(`[Trend] No old trends to clean up for server ${serverId}`);
        return 0;
      }

      const batch = this.db.batch();
      snapshot.docs.forEach((doc) => batch.delete(doc.ref));
      await batch.commit();

      console.log(`[Trend] Cleaned up ${snapshot.docs.length} old trends for server ${serverId}`);
      return snapshot.docs.length;
    } catch (error) {
      console.error('[Trend] Error cleaning up old trends:', error);
      throw error;
    }
  }

  /**
   * Get engagement over time for visualization
   */
  async getEngagementOverTime(
    serverId: string,
    days: number = 30,
    bucketSize: 'hour' | 'day' = 'day'
  ): Promise<Array<{ timestamp: Date; engagement: number; messageCount: number }>> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const trends = await this.getTrends({ serverId, startDate });

      // Group by time buckets
      const buckets = new Map<string, { engagement: number; count: number }>();

      for (const trend of trends) {
        const timestamp = trend.timestamp;
        let bucketKey: string;

        if (bucketSize === 'hour') {
          bucketKey = `${timestamp.getFullYear()}-${timestamp.getMonth()}-${timestamp.getDate()}-${timestamp.getHours()}`;
        } else {
          bucketKey = `${timestamp.getFullYear()}-${timestamp.getMonth()}-${timestamp.getDate()}`;
        }

        const existing = buckets.get(bucketKey) || { engagement: 0, count: 0 };
        buckets.set(bucketKey, {
          engagement: existing.engagement + trend.engagement,
          count: existing.count + 1,
        });
      }

      // Convert to array and sort
      const result = Array.from(buckets.entries())
        .map(([key, data]) => {
          const parts = key.split('-').map(Number);
          const timestamp = bucketSize === 'hour'
            ? new Date(parts[0], parts[1], parts[2], parts[3])
            : new Date(parts[0], parts[1], parts[2]);

          return {
            timestamp,
            engagement: data.engagement,
            messageCount: data.count,
          };
        })
        .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

      console.log(`[Trend] Retrieved engagement over time for server ${serverId}: ${result.length} buckets`);
      return result;
    } catch (error) {
      console.error('[Trend] Error getting engagement over time:', error);
      return [];
    }
  }
}

export const trendService = new TrendService();
