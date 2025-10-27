import { Message } from 'discord.js';
import { moderationService } from '../services/moderationService';
import { usageService } from '../services/usageService';
import { trendService } from '../services/trendService';
import { config } from '../config';

class MessageHandler {
  async handleMessage(message: Message): Promise<void> {
    if (message.author.bot) return;
    if (!message.guild) return;

    const startTime = Date.now();

    try {
      if (config.bot.spamDetectionEnabled) {
        const isSpam = await moderationService.handleSpamMessage(message);

        if (isSpam) {
          await usageService.incrementSpamCount(message.guild.id);
          return;
        }
      }

      await this.processLegitimateMessage(message, startTime);
    } catch (error) {
      console.error('Error handling message:', error);
    }
  }

  private async processLegitimateMessage(
    message: Message,
    startTime: number
  ): Promise<void> {
    const responseTime = Date.now() - startTime;

    const wasAnswered = await this.processQuestion(message);

    await usageService.incrementLegitimateCount(message.guild!.id, wasAnswered);

    await trendService.logTrend(
      message.guild!.id,
      message.author.id,
      message.channel.id,
      message.content,
      responseTime,
      wasAnswered
    );
  }

  private isQuestion(content: string): boolean {
    const questionIndicators = ['?', 'how', 'what', 'when', 'where', 'why', 'who', 'which'];
    const lowerContent = content.toLowerCase();
    
    return (
      content.includes('?') ||
      questionIndicators.some((indicator) => lowerContent.includes(indicator))
    );
  }

  private async processQuestion(message: Message): Promise<boolean> {
    const isQuestion = this.isQuestion(message.content);
    
    if (!isQuestion) {
      return false;
    }

    return true;
  }
}

export const messageHandler = new MessageHandler();
