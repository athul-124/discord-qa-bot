import { firestoreService } from './firestoreService';
import { UsageMetrics } from '../types';

class UsageService {
  private getPeriodKey(date: Date = new Date()): string {
    return date.toISOString().split('T')[0];
  }

  async incrementSpamCount(guildId: string): Promise<void> {
    const period = this.getPeriodKey();
    
    await firestoreService.updateUsageMetrics({
      guildId,
      totalMessages: 1,
      spamMessages: 1,
      legitimateMessages: 0,
      questionsAnswered: 0,
      unansweredQueries: 0,
      period,
      timestamp: new Date(),
    });
  }

  async incrementLegitimateCount(guildId: string, wasAnswered: boolean = false): Promise<void> {
    const period = this.getPeriodKey();
    
    await firestoreService.updateUsageMetrics({
      guildId,
      totalMessages: 1,
      spamMessages: 0,
      legitimateMessages: 1,
      questionsAnswered: wasAnswered ? 1 : 0,
      unansweredQueries: wasAnswered ? 0 : 1,
      period,
      timestamp: new Date(),
    });
  }

  async getUsageMetrics(
    guildId: string,
    date: Date = new Date()
  ): Promise<UsageMetrics | null> {
    const period = this.getPeriodKey(date);
    return await firestoreService.getUsageMetrics(guildId, period);
  }

  async getUsageMetricsForRange(
    guildId: string,
    startDate: Date,
    endDate: Date
  ): Promise<UsageMetrics[]> {
    const metrics: UsageMetrics[] = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const periodMetrics = await this.getUsageMetrics(guildId, currentDate);
      if (periodMetrics) {
        metrics.push(periodMetrics);
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return metrics;
  }

  aggregateMetrics(metrics: UsageMetrics[]): UsageMetrics {
    return metrics.reduce(
      (acc, metric) => ({
        ...acc,
        totalMessages: acc.totalMessages + metric.totalMessages,
        spamMessages: acc.spamMessages + metric.spamMessages,
        legitimateMessages: acc.legitimateMessages + metric.legitimateMessages,
        questionsAnswered: acc.questionsAnswered + metric.questionsAnswered,
        unansweredQueries: acc.unansweredQueries + metric.unansweredQueries,
      }),
      {
        guildId: metrics[0]?.guildId || '',
        totalMessages: 0,
        spamMessages: 0,
        legitimateMessages: 0,
        questionsAnswered: 0,
        unansweredQueries: 0,
        period: 'aggregated',
        timestamp: new Date(),
      }
    );
  }
}

export const usageService = new UsageService();
