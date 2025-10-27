import { getFirestore } from '../config/firebase';
import { ServerConfig, serverConfigConverter, ServerTier, GuildConfig } from '../types';

const COLLECTION_NAME = 'server_configs';
const LEGACY_COLLECTION_NAME = 'guild_configs';

export class ConfigService {
  private db = getFirestore();

  /**
   * Get server configuration
   */
  async getServerConfig(serverId: string): Promise<ServerConfig | null> {
    try {
      const doc = await this.db
        .collection(COLLECTION_NAME)
        .doc(serverId)
        .withConverter(serverConfigConverter)
        .get();

      if (!doc.exists) {
        console.log(`[Config] No configuration found for server ${serverId}`);
        return null;
      }

      const config = doc.data();
      return config || null;
    } catch (error) {
      console.error(`[Config] Error fetching config for server ${serverId}:`, error);
      return null;
    }
  }

  /**
   * Create or update server configuration
   */
  async upsertServerConfig(config: ServerConfig): Promise<void> {
    try {
      const docRef = this.db
        .collection(COLLECTION_NAME)
        .doc(config.serverId)
        .withConverter(serverConfigConverter);

      const existing = await docRef.get();

      if (existing.exists) {
        await docRef.update({
          ...config,
          updatedAt: new Date(),
        } as any);
        console.log(`[Config] Updated configuration for server ${config.serverId}`);
      } else {
        await docRef.set({
          ...config,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        console.log(`[Config] Created configuration for server ${config.serverId}`);
      }
    } catch (error) {
      console.error(`[Config] Error upserting config for server ${config.serverId}:`, error);
      throw error;
    }
  }

  /**
   * Add a channel to the allowed channels list
   */
  async addAllowedChannel(serverId: string, channelId: string): Promise<void> {
    try {
      const config = await this.getServerConfig(serverId);

      if (!config) {
        // Create new config with this channel
        await this.upsertServerConfig({
          serverId,
          allowedChannelIds: [channelId],
          ownerId: '',
          tier: ServerTier.FREE,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        console.log(`[Config] Created new config for server ${serverId} with channel ${channelId}`);
        return;
      }

      if (config.allowedChannelIds.includes(channelId)) {
        console.log(`[Config] Channel ${channelId} already configured for server ${serverId}`);
        return;
      }

      await this.upsertServerConfig({
        ...config,
        allowedChannelIds: [...config.allowedChannelIds, channelId],
      });

      console.log(`[Config] Added channel ${channelId} to server ${serverId}`);
    } catch (error) {
      console.error(`[Config] Error adding channel for server ${serverId}:`, error);
      throw error;
    }
  }

  /**
   * Remove a channel from the allowed channels list
   */
  async removeAllowedChannel(serverId: string, channelId: string): Promise<void> {
    try {
      const config = await this.getServerConfig(serverId);

      if (!config) {
        console.log(`[Config] No config found for server ${serverId}`);
        return;
      }

      const updatedChannels = config.allowedChannelIds.filter((id) => id !== channelId);

      await this.upsertServerConfig({
        ...config,
        allowedChannelIds: updatedChannels,
      });

      console.log(`[Config] Removed channel ${channelId} from server ${serverId}`);
    } catch (error) {
      console.error(`[Config] Error removing channel for server ${serverId}:`, error);
      throw error;
    }
  }

  /**
   * List all allowed channels for a server
   */
  async listAllowedChannels(serverId: string): Promise<string[]> {
    try {
      const config = await this.getServerConfig(serverId);
      return config?.allowedChannelIds || [];
    } catch (error) {
      console.error(`[Config] Error listing channels for server ${serverId}:`, error);
      return [];
    }
  }

  /**
   * Update server tier
   */
  async updateTier(serverId: string, tier: ServerTier): Promise<void> {
    try {
      const config = await this.getServerConfig(serverId);

      if (!config) {
        throw new Error(`Server ${serverId} not found`);
      }

      await this.upsertServerConfig({
        ...config,
        tier,
      });

      console.log(`[Config] Updated tier for server ${serverId} to ${tier}`);
    } catch (error) {
      console.error(`[Config] Error updating tier for server ${serverId}:`, error);
      throw error;
    }
  }

  /**
   * Link Whop customer to server
   */
  async linkWhopCustomer(serverId: string, whopCustomerId: string): Promise<void> {
    try {
      const config = await this.getServerConfig(serverId);

      if (!config) {
        throw new Error(`Server ${serverId} not found`);
      }

      await this.upsertServerConfig({
        ...config,
        whopCustomerId,
      });

      console.log(`[Config] Linked Whop customer ${whopCustomerId} to server ${serverId}`);
    } catch (error) {
      console.error(`[Config] Error linking Whop customer for server ${serverId}:`, error);
      throw error;
    }
  }

  /**
   * Unlink Whop customer from server
   */
  async unlinkWhopCustomer(serverId: string): Promise<void> {
    try {
      const config = await this.getServerConfig(serverId);

      if (!config) {
        throw new Error(`Server ${serverId} not found`);
      }

      await this.upsertServerConfig({
        ...config,
        whopCustomerId: undefined,
      });

      console.log(`[Config] Unlinked Whop customer from server ${serverId}`);
    } catch (error) {
      console.error(`[Config] Error unlinking Whop customer for server ${serverId}:`, error);
      throw error;
    }
  }

  /**
   * Get server by Whop customer ID
   */
  async getServerByWhopCustomer(whopCustomerId: string): Promise<ServerConfig | null> {
    try {
      const snapshot = await this.db
        .collection(COLLECTION_NAME)
        .where('whopCustomerId', '==', whopCustomerId)
        .limit(1)
        .get();

      if (snapshot.empty) {
        console.log(`[Config] No server found for Whop customer ${whopCustomerId}`);
        return null;
      }

      const config = serverConfigConverter.fromFirestore(snapshot.docs[0] as any);
      return config;
    } catch (error) {
      console.error(`[Config] Error finding server for Whop customer ${whopCustomerId}:`, error);
      return null;
    }
  }

  /**
   * Update server owner
   */
  async updateOwner(serverId: string, ownerId: string): Promise<void> {
    try {
      const config = await this.getServerConfig(serverId);

      if (!config) {
        throw new Error(`Server ${serverId} not found`);
      }

      await this.upsertServerConfig({
        ...config,
        ownerId,
      });

      console.log(`[Config] Updated owner for server ${serverId} to ${ownerId}`);
    } catch (error) {
      console.error(`[Config] Error updating owner for server ${serverId}:`, error);
      throw error;
    }
  }

  /**
   * Get all servers for a specific tier
   */
  async getServersByTier(tier: ServerTier): Promise<ServerConfig[]> {
    try {
      const snapshot = await this.db
        .collection(COLLECTION_NAME)
        .where('tier', '==', tier)
        .get();

      const servers = snapshot.docs.map((doc) => 
        serverConfigConverter.fromFirestore(doc as any)
      );

      console.log(`[Config] Found ${servers.length} servers with tier ${tier}`);
      return servers;
    } catch (error) {
      console.error(`[Config] Error getting servers by tier ${tier}:`, error);
      return [];
    }
  }

  /**
   * Delete server configuration
   */
  async deleteServerConfig(serverId: string): Promise<void> {
    try {
      await this.db.collection(COLLECTION_NAME).doc(serverId).delete();
      console.log(`[Config] Deleted configuration for server ${serverId}`);
    } catch (error) {
      console.error(`[Config] Error deleting config for server ${serverId}:`, error);
      throw error;
    }
  }

  // ============================================================================
  // Legacy methods for backward compatibility
  // ============================================================================

  async getGuildConfig(guildId: string): Promise<GuildConfig | null> {
    try {
      const doc = await this.db.collection(LEGACY_COLLECTION_NAME).doc(guildId).get();
      
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

  async setOwnerContact(guildId: string, contact: string): Promise<void> {
    try {
      const configRef = this.db.collection(LEGACY_COLLECTION_NAME).doc(guildId);
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
