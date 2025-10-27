import { firestoreService } from './firestoreService';
import { TrendLog, TrendSummary } from '../types';

class TrendService {
  private extractKeywords(text: string): string[] {
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
      'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
      'should', 'could', 'can', 'may', 'might', 'what', 'how', 'when', 'where',
      'why', 'who', 'which', 'this', 'that', 'these', 'those', 'i', 'you',
      'he', 'she', 'it', 'we', 'they', 'my', 'your', 'his', 'her', 'its',
      'our', 'their',
    ]);

    const words = text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter((word) => word.length > 3 && !stopWords.has(word));

    return [...new Set(words)].slice(0, 10);
  }

  async logTrend(
    guildId: string,
    userId: string,
    channelId: string,
    question: string,
    responseTime: number,
    wasAnswered: boolean = true,
    satisfactionScore?: number
  ): Promise<void> {
    const keywords = this.extractKeywords(question);

    const trendLog: TrendLog = {
      guildId,
      userId,
      channelId,
      keywords,
      question: question.substring(0, 500),
      responseTime,
      satisfactionScore,
      wasAnswered,
      timestamp: new Date(),
    };

    await firestoreService.logTrend(trendLog);
  }

  async generateTrendSummary(
    guildId: string,
    startDate: Date,
    endDate: Date
  ): Promise<TrendSummary> {
    const trends = await firestoreService.getTrendLogs(guildId, startDate, endDate);
    const usageMetrics = await firestoreService.getUsageMetrics(
      guildId,
      this.getPeriodKey(startDate)
    );

    const keywordCounts = new Map<string, number>();
    const questionCounts = new Map<string, number>();
    const unansweredQueries: Array<{ question: string; timestamp: Date }> = [];
    let totalResponseTime = 0;
    let responseCount = 0;

    for (const trend of trends) {
      trend.keywords.forEach((keyword) => {
        keywordCounts.set(keyword, (keywordCounts.get(keyword) || 0) + 1);
      });

      const normalizedQuestion = trend.question.toLowerCase().trim();
      questionCounts.set(
        normalizedQuestion,
        (questionCounts.get(normalizedQuestion) || 0) + 1
      );

      if (!trend.wasAnswered) {
        unansweredQueries.push({
          question: trend.question,
          timestamp: trend.timestamp,
        });
      }

      totalResponseTime += trend.responseTime;
      responseCount++;
    }

    const topKeywords = Array.from(keywordCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([keyword, count]) => ({ keyword, count }));

    const topQuestions = Array.from(questionCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([question, count]) => ({ question, count }));

    return {
      guildId,
      period: {
        start: startDate,
        end: endDate,
      },
      topQuestions,
      topKeywords,
      unansweredQueries: unansweredQueries.slice(0, 10),
      spamCount: usageMetrics?.spamMessages || 0,
      totalMessages: usageMetrics?.totalMessages || trends.length,
      averageResponseTime:
        responseCount > 0 ? totalResponseTime / responseCount : 0,
    };
  }

  private getPeriodKey(date: Date = new Date()): string {
    return date.toISOString().split('T')[0];
  }
}

export const trendService = new TrendService();
