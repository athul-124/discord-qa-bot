import { Message } from 'discord.js';
import PQueue from 'p-queue';
import { usageService } from './usageService';

export class MessageProcessor {
  private queue: PQueue;

  constructor() {
    this.queue = new PQueue({ concurrency: 5 });
    console.log('[MessageProcessor] Initialized with concurrency limit of 5');
  }

  async enqueueMessage(message: Message): Promise<void> {
    this.queue.add(async () => {
      try {
        await this.processInboundMessage(message);
      } catch (error) {
        console.error(`[MessageProcessor] Error processing message ${message.id}:`, error);
      }
    });

    console.log(`[MessageProcessor] Message ${message.id} enqueued. Queue size: ${this.queue.size}, pending: ${this.queue.pending}`);
  }

  private async processInboundMessage(message: Message): Promise<void> {
    console.log(`[MessageProcessor] Processing message ${message.id} from guild ${message.guildId}`);

    try {
      if (!message.guildId) {
        console.log(`[MessageProcessor] Skipping message ${message.id}: No guild ID`);
        return;
      }

      await usageService.incrementUsage(message.guildId);

      const response = await this.generateResponse(message);
      
      await message.reply(response);
      console.log(`[MessageProcessor] Sent response to message ${message.id}`);
    } catch (error) {
      console.error(`[MessageProcessor] Error in processInboundMessage:`, error);
      
      try {
        await message.reply('⚠️ Sorry, I encountered an error processing your message. Please try again later.');
      } catch (replyError) {
        console.error(`[MessageProcessor] Failed to send error message:`, replyError);
      }
    }
  }

  private async generateResponse(message: Message): Promise<string> {
    console.log(`[MessageProcessor] Generating response for message: "${message.content.substring(0, 50)}..."`);
    
    return '🤖 **Knowledge engine coming soon!**\n\n' +
           'I\'m currently in development and learning mode. Soon I\'ll be able to answer your questions using our custom knowledge base.\n\n' +
           '*Stay tuned for updates!*';
  }

  getQueueStats() {
    return {
      size: this.queue.size,
      pending: this.queue.pending,
      isPaused: this.queue.isPaused,
    };
  }
}

export const messageProcessor = new MessageProcessor();
