import * as fs from 'fs';
import * as path from 'path';

export interface UsageStats {
  serverId: string;
  messageCount: number;
  lastReset: number;
  limitReached: boolean;
  history: Array<{
    timestamp: number;
    count: number;
  }>;
}

export class UsageService {
  private usagePath: string;
  private usage: Map<string, UsageStats>;
  private messageLimit: number;

  constructor() {
    this.usagePath = path.join(process.cwd(), 'data', 'usage.json');
    this.usage = new Map();
    this.messageLimit = parseInt(process.env.FREE_TIER_MESSAGE_LIMIT || '100', 10);
    this.loadUsage();
  }

  private ensureDataDir(): void {
    const dataDir = path.dirname(this.usagePath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
  }

  private loadUsage(): void {
    this.ensureDataDir();
    
    try {
      if (fs.existsSync(this.usagePath)) {
        const data = fs.readFileSync(this.usagePath, 'utf8');
        const usage = JSON.parse(data);
        this.usage = new Map(Object.entries(usage));
        console.log(`Loaded usage data for ${this.usage.size} servers`);
      }
    } catch (error) {
      console.error('Error loading usage:', error);
      this.usage = new Map();
    }
  }

  private saveUsage(): void {
    try {
      this.ensureDataDir();
      const data = JSON.stringify(Object.fromEntries(this.usage), null, 2);
      fs.writeFileSync(this.usagePath, data, 'utf8');
    } catch (error) {
      console.error('Error saving usage:', error);
    }
  }

  getUsage(serverId: string): UsageStats {
    const now = Date.now();
    const monthStart = new Date(now);
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    let stats = this.usage.get(serverId);

    if (!stats || stats.lastReset < monthStart.getTime()) {
      stats = {
        serverId,
        messageCount: 0,
        lastReset: monthStart.getTime(),
        limitReached: false,
        history: stats?.history || [],
      };
      this.usage.set(serverId, stats);
      this.saveUsage();
    }

    return stats;
  }

  incrementUsage(serverId: string): UsageStats {
    const stats = this.getUsage(serverId);
    stats.messageCount++;

    if (stats.messageCount >= this.messageLimit) {
      stats.limitReached = true;
    }

    stats.history.push({
      timestamp: Date.now(),
      count: stats.messageCount,
    });

    if (stats.history.length > 1000) {
      stats.history = stats.history.slice(-1000);
    }

    this.usage.set(serverId, stats);
    this.saveUsage();

    return stats;
  }

  hasReachedLimit(serverId: string): boolean {
    const stats = this.getUsage(serverId);
    return stats.messageCount >= this.messageLimit;
  }

  getRemainingMessages(serverId: string): number {
    const stats = this.getUsage(serverId);
    return Math.max(0, this.messageLimit - stats.messageCount);
  }

  resetUsage(serverId: string): void {
    const stats: UsageStats = {
      serverId,
      messageCount: 0,
      lastReset: Date.now(),
      limitReached: false,
      history: [],
    };
    this.usage.set(serverId, stats);
    this.saveUsage();
  }

  getAllUsage(): UsageStats[] {
    return Array.from(this.usage.values());
  }
}

export const usageService = new UsageService();
