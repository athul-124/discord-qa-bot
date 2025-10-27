import * as fs from 'fs';
import * as path from 'path';

export interface ServerConfig {
  serverId: string;
  ownerId: string;
  tier: 'free' | 'pro';
  whopCustomerId?: string;
  whopToken?: string;
  expiresAt?: number;
  linkedAt: number;
  knowledgeBase?: string;
  settings?: {
    enabled: boolean;
    channelIds?: string[];
  };
}

export class ConfigService {
  private configPath: string;
  private configs: Map<string, ServerConfig>;

  constructor() {
    this.configPath = path.join(process.cwd(), 'data', 'configs.json');
    this.configs = new Map();
    this.loadConfigs();
  }

  private ensureDataDir(): void {
    const dataDir = path.dirname(this.configPath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
  }

  private loadConfigs(): void {
    this.ensureDataDir();
    
    try {
      if (fs.existsSync(this.configPath)) {
        const data = fs.readFileSync(this.configPath, 'utf8');
        const configs = JSON.parse(data);
        this.configs = new Map(Object.entries(configs));
        console.log(`Loaded ${this.configs.size} server configurations`);
      }
    } catch (error) {
      console.error('Error loading configs:', error);
      this.configs = new Map();
    }
  }

  private saveConfigs(): void {
    try {
      this.ensureDataDir();
      const data = JSON.stringify(Object.fromEntries(this.configs), null, 2);
      fs.writeFileSync(this.configPath, data, 'utf8');
    } catch (error) {
      console.error('Error saving configs:', error);
    }
  }

  getConfig(serverId: string): ServerConfig | null {
    return this.configs.get(serverId) || null;
  }

  getAllConfigs(): ServerConfig[] {
    return Array.from(this.configs.values());
  }

  setConfig(serverId: string, config: Partial<ServerConfig>): ServerConfig {
    const existing = this.configs.get(serverId);
    
    const updated: ServerConfig = {
      serverId,
      ownerId: config.ownerId || existing?.ownerId || '',
      tier: config.tier || existing?.tier || 'free',
      whopCustomerId: config.whopCustomerId || existing?.whopCustomerId,
      whopToken: config.whopToken || existing?.whopToken,
      expiresAt: config.expiresAt || existing?.expiresAt,
      linkedAt: existing?.linkedAt || Date.now(),
      knowledgeBase: config.knowledgeBase || existing?.knowledgeBase,
      settings: {
        enabled: config.settings?.enabled ?? existing?.settings?.enabled ?? true,
        channelIds: config.settings?.channelIds || existing?.settings?.channelIds || [],
      },
    };

    this.configs.set(serverId, updated);
    this.saveConfigs();
    return updated;
  }

  linkServer(
    serverId: string,
    ownerId: string,
    tier: 'free' | 'pro',
    whopCustomerId?: string,
    whopToken?: string,
    expiresAt?: number
  ): ServerConfig {
    return this.setConfig(serverId, {
      serverId,
      ownerId,
      tier,
      whopCustomerId,
      whopToken,
      expiresAt,
    });
  }

  deleteConfig(serverId: string): boolean {
    const deleted = this.configs.delete(serverId);
    if (deleted) {
      this.saveConfigs();
    }
    return deleted;
  }

  getTier(serverId: string): 'free' | 'pro' {
    const config = this.configs.get(serverId);
    
    if (!config) {
      return 'free';
    }

    if (config.tier === 'pro' && config.expiresAt) {
      if (Date.now() > config.expiresAt) {
        this.setConfig(serverId, { tier: 'free' });
        return 'free';
      }
    }

    return config.tier;
  }

  isProTier(serverId: string): boolean {
    return this.getTier(serverId) === 'pro';
  }

  updateKnowledgeBase(serverId: string, knowledgeBase: string): void {
    this.setConfig(serverId, { knowledgeBase });
  }

  getKnowledgeBase(serverId: string): string | undefined {
    return this.configs.get(serverId)?.knowledgeBase;
  }

  async getGuildConfig(guildId: string): Promise<ServerConfig> {
    let config = this.getConfig(guildId);
    
    if (!config) {
      config = this.setConfig(guildId, {
        serverId: guildId,
        ownerId: '',
        tier: 'free',
        settings: {
          enabled: true,
          channelIds: [],
        },
      });
    }
    
    return config;
  }

  async addAllowedChannel(guildId: string, channelId: string): Promise<void> {
    const config = await this.getGuildConfig(guildId);
    const channelIds = config.settings?.channelIds || [];
    
    if (!channelIds.includes(channelId)) {
      channelIds.push(channelId);
      this.setConfig(guildId, {
        settings: {
          ...config.settings,
          enabled: config.settings?.enabled ?? true,
          channelIds,
        },
      });
    }
  }

  async removeAllowedChannel(guildId: string, channelId: string): Promise<void> {
    const config = await this.getGuildConfig(guildId);
    const channelIds = (config.settings?.channelIds || []).filter(id => id !== channelId);
    
    this.setConfig(guildId, {
      settings: {
        ...config.settings,
        enabled: config.settings?.enabled ?? true,
        channelIds,
      },
    });
  }

  async listAllowedChannels(guildId: string): Promise<string[]> {
    const config = await this.getGuildConfig(guildId);
    return config.settings?.channelIds || [];
  }

  async setOwnerContact(guildId: string, contact: string): Promise<void> {
    const config = await this.getGuildConfig(guildId);
    this.setConfig(guildId, {
      ownerId: contact,
    });
  }

  get allowedChannels(): string[] {
    const config = Array.from(this.configs.values())[0];
    return config?.settings?.channelIds || [];
  }
}

export const configService = new ConfigService();
