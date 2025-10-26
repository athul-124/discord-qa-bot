import { Firestore } from '@google-cloud/firestore';

export interface ServerConfig {
  guildId: string;
  aiEnabled: boolean;
  enabledChannels: string[];
  confidenceThreshold: number;
  notifyOnMiss: boolean;
}

export class ConfigService {
  private db: Firestore;
  private collectionName: string;

  constructor(db: Firestore, collectionName: string = 'server_configs') {
    this.db = db;
    this.collectionName = collectionName;
  }

  async getConfig(guildId: string): Promise<ServerConfig> {
    const docRef = this.db.collection(this.collectionName).doc(guildId);
    const doc = await docRef.get();

    if (!doc.exists) {
      return this.getDefaultConfig(guildId);
    }

    const data = doc.data()!;
    return {
      guildId,
      aiEnabled: data.aiEnabled ?? true,
      enabledChannels: data.enabledChannels || [],
      confidenceThreshold: data.confidenceThreshold ?? 0.7,
      notifyOnMiss: data.notifyOnMiss ?? false
    };
  }

  async setAiEnabled(guildId: string, enabled: boolean): Promise<void> {
    const docRef = this.db.collection(this.collectionName).doc(guildId);
    await docRef.set({ aiEnabled: enabled }, { merge: true });
  }

  async addEnabledChannel(guildId: string, channelId: string): Promise<void> {
    const config = await this.getConfig(guildId);
    
    if (!config.enabledChannels.includes(channelId)) {
      config.enabledChannels.push(channelId);
      await this.db.collection(this.collectionName).doc(guildId).set({
        enabledChannels: config.enabledChannels
      }, { merge: true });
    }
  }

  async removeEnabledChannel(guildId: string, channelId: string): Promise<void> {
    const config = await this.getConfig(guildId);
    
    const updatedChannels = config.enabledChannels.filter(id => id !== channelId);
    await this.db.collection(this.collectionName).doc(guildId).set({
      enabledChannels: updatedChannels
    }, { merge: true });
  }

  async setConfidenceThreshold(guildId: string, threshold: number): Promise<void> {
    const docRef = this.db.collection(this.collectionName).doc(guildId);
    await docRef.set({ confidenceThreshold: threshold }, { merge: true });
  }

  async setNotifyOnMiss(guildId: string, notify: boolean): Promise<void> {
    const docRef = this.db.collection(this.collectionName).doc(guildId);
    await docRef.set({ notifyOnMiss: notify }, { merge: true });
  }

  private getDefaultConfig(guildId: string): ServerConfig {
    return {
      guildId,
      aiEnabled: true,
      enabledChannels: [],
      confidenceThreshold: 0.7,
      notifyOnMiss: false
    };
  }

  async isChannelEnabled(guildId: string, channelId: string): Promise<boolean> {
    const config = await this.getConfig(guildId);
    
    if (config.enabledChannels.length === 0) {
      return true;
    }
    
    return config.enabledChannels.includes(channelId);
  }
}
