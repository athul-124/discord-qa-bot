import { Client, GatewayIntentBits, Message, TextChannel, EmbedBuilder } from 'discord.js';
import { configService } from './configService';
import { usageService } from './usageService';

export class DiscordService {
  private client: Client;
  private ready: boolean = false;

  constructor() {
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages,
      ],
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.client.on('ready', () => {
      console.log(`Discord bot logged in as ${this.client.user?.tag}`);
      this.ready = true;
    });

    this.client.on('messageCreate', async (message: Message) => {
      await this.handleMessage(message);
    });

    this.client.on('guildCreate', (guild) => {
      console.log(`Bot joined guild: ${guild.name} (${guild.id})`);
      configService.setConfig(guild.id, {
        serverId: guild.id,
        ownerId: guild.ownerId,
        tier: 'free',
      });
    });

    this.client.on('guildDelete', (guild) => {
      console.log(`Bot left guild: ${guild.name} (${guild.id})`);
    });
  }

  private async handleMessage(message: Message): Promise<void> {
    if (message.author.bot) return;
    if (!message.guild) return;

    const serverId = message.guild.id;
    const config = configService.getConfig(serverId);

    if (!config || !config.settings?.enabled) {
      return;
    }

    if (config.settings.channelIds && config.settings.channelIds.length > 0) {
      if (!config.settings.channelIds.includes(message.channel.id)) {
        return;
      }
    }

    const tier = configService.getTier(serverId);

    if (tier === 'free') {
      if (usageService.hasReachedLimit(serverId)) {
        if (!usageService.getUsage(serverId).limitReached) {
          await this.sendLimitReachedNotice(message);
        }
        return;
      }
    }

    await this.processMessage(message);
  }

  private async processMessage(message: Message): Promise<void> {
    const serverId = message.guild!.id;
    const tier = configService.getTier(serverId);

    if (tier === 'free') {
      usageService.incrementUsage(serverId);
    }

    const knowledgeBase = configService.getKnowledgeBase(serverId);

    try {
      const response = await this.generateResponse(message.content, knowledgeBase);
      await message.reply(response);

      console.log(`Processed message in ${serverId} (${tier} tier)`);
    } catch (error) {
      console.error('Error processing message:', error);
      await message.reply('Sorry, I encountered an error processing your question.');
    }
  }

  private async generateResponse(question: string, knowledgeBase?: string): Promise<string> {
    if (knowledgeBase) {
      return `Based on the knowledge base, here's my answer: [This would use AI/ML to generate a response based on "${question}" and the KB]`;
    }
    return `I received your question: "${question}". Please configure a knowledge base for better answers.`;
  }

  private async sendLimitReachedNotice(message: Message): Promise<void> {
    const embed = new EmbedBuilder()
      .setColor(0xFF6B6B)
      .setTitle('📊 Free Tier Limit Reached')
      .setDescription(
        'Your server has reached the free tier limit of 100 messages per month.\n\n' +
        '✨ **Upgrade to Pro** for:\n' +
        '• Unlimited message processing\n' +
        '• Daily trend insights\n' +
        '• Priority support\n\n' +
        'Visit your dashboard to upgrade!'
      )
      .setTimestamp();

    try {
      await message.reply({ embeds: [embed] });
      
      const owner = await message.guild?.fetchOwner();
      if (owner) {
        await owner.send({ embeds: [embed] });
      }
    } catch (error) {
      console.error('Error sending limit notice:', error);
    }
  }

  async sendDailyInsights(): Promise<void> {
    const configs = configService.getAllConfigs();
    
    for (const config of configs) {
      if (config.tier === 'pro' && config.settings?.enabled) {
        await this.sendServerInsights(config.serverId);
      }
    }
  }

  private async sendServerInsights(serverId: string): Promise<void> {
    try {
      const guild = this.client.guilds.cache.get(serverId);
      if (!guild) return;

      const owner = await guild.fetchOwner();
      const usage = usageService.getUsage(serverId);

      const embed = new EmbedBuilder()
        .setColor(0x4CAF50)
        .setTitle('📈 Daily Server Insights')
        .setDescription(`Here's your daily report for **${guild.name}**`)
        .addFields(
          { name: 'Messages This Month', value: usage.messageCount.toString(), inline: true },
          { name: 'Tier', value: 'Pro ✨', inline: true }
        )
        .setTimestamp();

      await owner.send({ embeds: [embed] });
      console.log(`Sent daily insights to ${serverId}`);
    } catch (error) {
      console.error(`Error sending insights to ${serverId}:`, error);
    }
  }

  async start(token: string): Promise<void> {
    await this.client.login(token);
  }

  getClient(): Client {
    return this.client;
  }

  isReady(): boolean {
    return this.ready;
  }

  async verifyServerOwnership(serverId: string, userId: string): Promise<boolean> {
    try {
      const guild = this.client.guilds.cache.get(serverId);
      if (!guild) {
        await this.client.guilds.fetch(serverId);
        const fetchedGuild = this.client.guilds.cache.get(serverId);
        return fetchedGuild?.ownerId === userId;
      }
      return guild.ownerId === userId;
    } catch (error) {
      console.error('Error verifying server ownership:', error);
      return false;
    }
  }
}

export const discordService = new DiscordService();
