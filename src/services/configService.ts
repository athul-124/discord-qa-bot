import { getFirestore } from './firebase';
import { GuildConfig } from '../types';

export class ConfigService {
  private db = getFirestore();
  private collection = 'guild_configs';

  async getGuildConfig(guildId: string): Promise<GuildConfig | null> {
    try {
      const doc = await this.db.collection(this.collection).doc(guildId).get();
      
      if (!doc.exists) {
        return null;
      }

      const data = doc.data();
      return {
        guildId,
        allowedChannels: data?.allowedChannels || [],
        ownerContact: data?.ownerContact,
        createdAt: data?.createdAt?.toDate() || new Date(),
        updatedAt: data?.updatedAt?.toDate() || new Date(),
      };
    } catch (error) {
      console.error(`[ConfigService] Error fetching config for guild ${guildId}:`, error);
      return null;
    }
  }

  async addAllowedChannel(guildId: string, channelId: string): Promise<void> {
    try {
      const configRef = this.db.collection(this.collection).doc(guildId);
      const doc = await configRef.get();

      if (!doc.exists) {
        await configRef.set({
          allowedChannels: [channelId],
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        console.log(`[ConfigService] Created new config for guild ${guildId} with channel ${channelId}`);
      } else {
        const data = doc.data();
        const allowedChannels = data?.allowedChannels || [];
        
        if (allowedChannels.includes(channelId)) {
          console.log(`[ConfigService] Channel ${channelId} already configured for guild ${guildId}`);
          return;
        }

        await configRef.update({
          allowedChannels: [...allowedChannels, channelId],
          updatedAt: new Date(),
        });
        console.log(`[ConfigService] Added channel ${channelId} to guild ${guildId}`);
      }
    } catch (error) {
      console.error(`[ConfigService] Error adding channel for guild ${guildId}:`, error);
      throw error;
    }
  }

  async removeAllowedChannel(guildId: string, channelId: string): Promise<void> {
    try {
      const configRef = this.db.collection(this.collection).doc(guildId);
      const doc = await configRef.get();

      if (!doc.exists) {
        console.log(`[ConfigService] No config found for guild ${guildId}`);
        return;
      }

      const data = doc.data();
      const allowedChannels = data?.allowedChannels || [];
      const updatedChannels = allowedChannels.filter((id: string) => id !== channelId);

      await configRef.update({
        allowedChannels: updatedChannels,
        updatedAt: new Date(),
      });
      console.log(`[ConfigService] Removed channel ${channelId} from guild ${guildId}`);
    } catch (error) {
      console.error(`[ConfigService] Error removing channel for guild ${guildId}:`, error);
      throw error;
    }
  }

  async listAllowedChannels(guildId: string): Promise<string[]> {
    try {
      const config = await this.getGuildConfig(guildId);
      return config?.allowedChannels || [];
    } catch (error) {
      console.error(`[ConfigService] Error listing channels for guild ${guildId}:`, error);
      return [];
    }
  }

  async setOwnerContact(guildId: string, contact: string): Promise<void> {
    try {
      const configRef = this.db.collection(this.collection).doc(guildId);
      const doc = await configRef.get();

      if (!doc.exists) {
        await configRef.set({
          allowedChannels: [],
          ownerContact: contact,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      } else {
        await configRef.update({
          ownerContact: contact,
          updatedAt: new Date(),
        });
      }
      console.log(`[ConfigService] Set owner contact for guild ${guildId}`);
    } catch (error) {
      console.error(`[ConfigService] Error setting owner contact for guild ${guildId}:`, error);
      throw error;
    }
  }
}

export const configService = new ConfigService();
