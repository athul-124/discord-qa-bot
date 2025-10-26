import { Message } from 'discord.js';
import { FirestoreKnowledgeSearchService } from '../services/firestoreKnowledgeSearch';
import { GeminiService } from '../services/geminiService';
import { UsageService } from '../services/usageService';
import { ConfigService } from '../services/configService';

interface MissTracker {
  [userId: string]: {
    count: number;
    lastMiss: Date;
  };
}

export class MessageHandler {
  private knowledgeSearch: FirestoreKnowledgeSearchService;
  private geminiService: GeminiService;
  private usageService: UsageService;
  private configService: ConfigService;
  private missTracker: MissTracker = {};
  private missThreshold: number = 3;
  private ownerUserId?: string;

  constructor(
    knowledgeSearch: FirestoreKnowledgeSearchService,
    geminiService: GeminiService,
    usageService: UsageService,
    configService: ConfigService,
    ownerUserId?: string
  ) {
    this.knowledgeSearch = knowledgeSearch;
    this.geminiService = geminiService;
    this.usageService = usageService;
    this.configService = configService;
    this.ownerUserId = ownerUserId;
  }

  async handleMessage(message: Message): Promise<void> {
    if (message.author.bot) return;

    if (!message.guild) {
      console.log('Message not from a guild, ignoring');
      return;
    }

    const config = await this.configService.getConfig(message.guild.id);
    
    if (!config.aiEnabled) {
      console.log('AI responses disabled for this server');
      return;
    }

    const isChannelEnabled = await this.configService.isChannelEnabled(
      message.guild.id,
      message.channel.id
    );

    if (!isChannelEnabled) {
      console.log('Channel not enabled for AI responses');
      return;
    }

    const canSend = await this.usageService.canSendMessage(message.author.id);
    
    if (!canSend) {
      await message.reply(
        'You have reached your monthly message limit. Please upgrade to continue using the bot.'
      );
      return;
    }

    await this.processQuery(message, config.confidenceThreshold);
  }

  private async processQuery(message: Message, confidenceThreshold: number): Promise<void> {
    try {
      if ('sendTyping' in message.channel) {
        await message.channel.sendTyping();
      }

      const query = message.content;
      const matches = await this.knowledgeSearch.search(query, 3);

      if (matches.length === 0) {
        await this.handleNoMatch(message);
        return;
      }

      const bestScore = matches[0].score;

      if (bestScore < confidenceThreshold) {
        await this.handleLowConfidence(message, bestScore);
        return;
      }

      const response = await this.geminiService.generateResponse(query, matches);

      if (response.includes("I don't have enough information")) {
        await this.handleNoMatch(message);
        return;
      }

      await message.reply(response);

      await this.usageService.incrementUsage(message.author.id);

      this.resetMissTracker(message.author.id);

    } catch (error) {
      console.error('Error processing query:', error);
      await message.reply(
        'Sorry, I encountered an error while processing your question. Please try again.'
      );
    }
  }

  private async handleNoMatch(message: Message): Promise<void> {
    await message.reply(
      "I couldn't find relevant information in my knowledge base to answer your question. Please try rephrasing or contact support for help."
    );

    this.trackMiss(message.author.id);
    await this.checkAndNotifyOwner(message);
  }

  private async handleLowConfidence(message: Message, score: number): Promise<void> {
    await message.reply(
      `I found some potentially relevant information, but I'm not confident enough (${(score * 100).toFixed(1)}% confidence) to provide an accurate answer. Please try rephrasing your question or contact support.`
    );

    this.trackMiss(message.author.id);
    await this.checkAndNotifyOwner(message);
  }

  private trackMiss(userId: string): void {
    if (!this.missTracker[userId]) {
      this.missTracker[userId] = {
        count: 0,
        lastMiss: new Date()
      };
    }

    this.missTracker[userId].count++;
    this.missTracker[userId].lastMiss = new Date();
  }

  private resetMissTracker(userId: string): void {
    if (this.missTracker[userId]) {
      delete this.missTracker[userId];
    }
  }

  private async checkAndNotifyOwner(message: Message): Promise<void> {
    const tracker = this.missTracker[message.author.id];
    
    if (!tracker || !this.ownerUserId) {
      return;
    }

    if (tracker.count >= this.missThreshold) {
      try {
        const owner = await message.client.users.fetch(this.ownerUserId);
        
        await owner.send(
          `**Repeated Knowledge Base Misses Alert**\n\n` +
          `User: ${message.author.tag} (${message.author.id})\n` +
          `Server: ${message.guild?.name}\n` +
          `Channel: ${message.channel}\n` +
          `Miss Count: ${tracker.count}\n` +
          `Latest Query: "${message.content}"\n\n` +
          `Consider reviewing the knowledge base to add this information.`
        );

        this.resetMissTracker(message.author.id);
      } catch (error) {
        console.error('Failed to notify owner:', error);
      }
    }
  }

  setMissThreshold(threshold: number): void {
    this.missThreshold = threshold;
  }

  getMissCount(userId: string): number {
    return this.missTracker[userId]?.count || 0;
  }
}
