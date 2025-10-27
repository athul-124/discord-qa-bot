export interface GuildConfig {
  guildId: string;
  spamPatternsEnabled: boolean;
  customSpamPatterns: string[];
  moderatorRoleId?: string;
  optOutSpamDeletion: boolean;
  notificationChannelId?: string;
}

export interface ModerationLog {
  id?: string;
  guildId: string;
  userId: string;
  username: string;
  action: 'spam_deletion' | 'manual_delete' | 'timeout' | 'ban';
  reason: string;
  messageContent: string;
  channelId: string;
  timestamp: Date;
  metadata?: Record<string, string | number | boolean>;
}

export interface UsageMetrics {
  guildId: string;
  totalMessages: number;
  spamMessages: number;
  legitimateMessages: number;
  questionsAnswered: number;
  unansweredQueries: number;
  period: string;
  timestamp: Date;
}

export interface TrendLog {
  id?: string;
  guildId: string;
  userId: string;
  channelId: string;
  keywords: string[];
  question: string;
  responseTime: number;
  satisfactionScore?: number;
  wasAnswered: boolean;
  timestamp: Date;
}

export interface TrendSummary {
  guildId: string;
  period: {
    start: Date;
    end: Date;
  };
  topQuestions: Array<{
    question: string;
    count: number;
  }>;
  topKeywords: Array<{
    keyword: string;
    count: number;
  }>;
  unansweredQueries: Array<{
    question: string;
    timestamp: Date;
  }>;
  spamCount: number;
  totalMessages: number;
  averageResponseTime: number;
}

export interface SpamDetectionResult {
  isSpam: boolean;
  matchedPattern?: string;
  reason?: string;
}
