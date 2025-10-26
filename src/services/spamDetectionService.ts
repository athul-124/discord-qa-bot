import { SPAM_BASE_PATTERN, DEFAULT_SPAM_PATTERNS } from '../config';
import { SpamDetectionResult } from '../types';
import { firestoreService } from './firestoreService';

class SpamDetectionService {
  async detectSpam(
    content: string,
    guildId: string
  ): Promise<SpamDetectionResult> {
    const guildConfig = await firestoreService.getGuildConfig(guildId);

    if (!guildConfig.spamPatternsEnabled) {
      return { isSpam: false };
    }

    if (SPAM_BASE_PATTERN.test(content)) {
      const urlMatch = content.match(/https?:\/\/[^\s]+/);
      return {
        isSpam: true,
        matchedPattern: 'BASE_PATTERN',
        reason: urlMatch
          ? `Suspicious URL detected: ${urlMatch[0]}`
          : 'Spam keyword detected',
      };
    }

    for (const pattern of DEFAULT_SPAM_PATTERNS) {
      if (pattern.test(content)) {
        return {
          isSpam: true,
          matchedPattern: pattern.toString(),
          reason: `Matched default spam pattern: ${pattern.toString()}`,
        };
      }
    }

    for (const customPattern of guildConfig.customSpamPatterns) {
      try {
        const regex = new RegExp(customPattern, 'i');
        if (regex.test(content)) {
          return {
            isSpam: true,
            matchedPattern: customPattern,
            reason: `Matched custom spam pattern: ${customPattern}`,
          };
        }
      } catch (error) {
        console.error(`Invalid custom pattern: ${customPattern}`, error);
      }
    }

    return { isSpam: false };
  }

  async addCustomPattern(guildId: string, pattern: string): Promise<void> {
    const guildConfig = await firestoreService.getGuildConfig(guildId);
    
    if (!guildConfig.customSpamPatterns.includes(pattern)) {
      guildConfig.customSpamPatterns.push(pattern);
      await firestoreService.updateGuildConfig(guildId, {
        customSpamPatterns: guildConfig.customSpamPatterns,
      });
    }
  }

  async removeCustomPattern(guildId: string, pattern: string): Promise<void> {
    const guildConfig = await firestoreService.getGuildConfig(guildId);
    
    const updatedPatterns = guildConfig.customSpamPatterns.filter(
      (p) => p !== pattern
    );
    
    await firestoreService.updateGuildConfig(guildId, {
      customSpamPatterns: updatedPatterns,
    });
  }

  async listCustomPatterns(guildId: string): Promise<string[]> {
    const guildConfig = await firestoreService.getGuildConfig(guildId);
    return guildConfig.customSpamPatterns;
  }
}

export const spamDetectionService = new SpamDetectionService();
