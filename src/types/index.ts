import { Timestamp, DocumentData, QueryDocumentSnapshot } from 'firebase-admin/firestore';

// ============================================================================
// Core Interfaces
// ============================================================================

/**
 * Tier levels for server subscriptions
 */
export enum ServerTier {
  FREE = 'free',
  PREMIUM = 'premium',
  ENTERPRISE = 'enterprise',
}

/**
 * Server/Guild configuration
 * Collection: server_configs
 */
export interface ServerConfig {
  serverId: string;
  allowedChannelIds: string[];
  ownerId: string;
  whopCustomerId?: string;
  tier: ServerTier;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Knowledge base entry
 * Collection: knowledge_entries
 */
export interface KnowledgeEntry {
  id?: string;
  serverId: string;
  question: string;
  answer: string;
  keywords: string[];
  createdAt: Date;
  updatedAt?: Date;
  sourceFilePath?: string;
}

/**
 * Usage tracking entry
 * Collection: usage_entries
 */
export interface UsageEntry {
  id?: string;
  serverId: string;
  monthKey: string; // Format: YYYY-MM
  messageCount: number;
  lastMessageAt: Date;
  createdAt: Date;
}

/**
 * Trend tracking entry
 * Collection: trend_entries
 */
export interface TrendEntry {
  id?: string;
  serverId: string;
  timestamp: Date;
  keywords: string[];
  engagement: number; // Number of reactions, replies, etc.
  messageId?: string;
}

// Legacy interfaces (for backward compatibility)
export interface GuildConfig {
  guildId: string;
  allowedChannels: string[];
  ownerContact?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UsageRecord {
  guildId: string;
  month: string;
  count: number;
  limit: number;
}

export interface QueuedMessage {
  messageId: string;
  channelId: string;
  guildId: string;
  content: string;
  authorId: string;
  timestamp: Date;
}

// ============================================================================
// Firestore Converters
// ============================================================================

/**
 * Converter for ServerConfig
 */
export const serverConfigConverter = {
  toFirestore: (config: ServerConfig): DocumentData => {
    return {
      serverId: config.serverId,
      allowedChannelIds: config.allowedChannelIds,
      ownerId: config.ownerId,
      whopCustomerId: config.whopCustomerId || null,
      tier: config.tier,
      createdAt: Timestamp.fromDate(config.createdAt),
      updatedAt: Timestamp.fromDate(config.updatedAt),
    };
  },
  fromFirestore: (snapshot: QueryDocumentSnapshot): ServerConfig => {
    const data = snapshot.data();
    return {
      serverId: data.serverId,
      allowedChannelIds: data.allowedChannelIds || [],
      ownerId: data.ownerId,
      whopCustomerId: data.whopCustomerId || undefined,
      tier: data.tier || ServerTier.FREE,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    };
  },
};

/**
 * Converter for KnowledgeEntry
 */
export const knowledgeEntryConverter = {
  toFirestore: (entry: KnowledgeEntry): DocumentData => {
    return {
      serverId: entry.serverId,
      question: entry.question,
      answer: entry.answer,
      keywords: entry.keywords,
      createdAt: Timestamp.fromDate(entry.createdAt),
      updatedAt: entry.updatedAt ? Timestamp.fromDate(entry.updatedAt) : null,
      sourceFilePath: entry.sourceFilePath || null,
    };
  },
  fromFirestore: (snapshot: QueryDocumentSnapshot): KnowledgeEntry => {
    const data = snapshot.data();
    return {
      id: snapshot.id,
      serverId: data.serverId,
      question: data.question,
      answer: data.answer,
      keywords: data.keywords || [],
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || undefined,
      sourceFilePath: data.sourceFilePath || undefined,
    };
  },
};

/**
 * Converter for UsageEntry
 */
export const usageEntryConverter = {
  toFirestore: (entry: UsageEntry): DocumentData => {
    return {
      serverId: entry.serverId,
      monthKey: entry.monthKey,
      messageCount: entry.messageCount,
      lastMessageAt: Timestamp.fromDate(entry.lastMessageAt),
      createdAt: Timestamp.fromDate(entry.createdAt),
    };
  },
  fromFirestore: (snapshot: QueryDocumentSnapshot): UsageEntry => {
    const data = snapshot.data();
    return {
      id: snapshot.id,
      serverId: data.serverId,
      monthKey: data.monthKey,
      messageCount: data.messageCount || 0,
      lastMessageAt: data.lastMessageAt?.toDate() || new Date(),
      createdAt: data.createdAt?.toDate() || new Date(),
    };
  },
};

/**
 * Converter for TrendEntry
 */
export const trendEntryConverter = {
  toFirestore: (entry: TrendEntry): DocumentData => {
    return {
      serverId: entry.serverId,
      timestamp: Timestamp.fromDate(entry.timestamp),
      keywords: entry.keywords,
      engagement: entry.engagement,
      messageId: entry.messageId || null,
    };
  },
  fromFirestore: (snapshot: QueryDocumentSnapshot): TrendEntry => {
    const data = snapshot.data();
    return {
      id: snapshot.id,
      serverId: data.serverId,
      timestamp: data.timestamp?.toDate() || new Date(),
      keywords: data.keywords || [],
      engagement: data.engagement || 0,
      messageId: data.messageId || undefined,
    };
  },
};
