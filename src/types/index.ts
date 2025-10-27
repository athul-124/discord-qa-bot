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
