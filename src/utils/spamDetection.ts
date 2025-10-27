export interface SpamCheckResult {
  isSpam: boolean;
  reason?: string;
}

export class SpamDetector {
  private urlPattern: RegExp;
  private suspiciousPatterns: RegExp[];
  private maxLength: number;

  constructor(maxLength: number = 2000) {
    this.maxLength = maxLength;
    this.urlPattern = /https?:\/\/[^\s]+|www\.[^\s]+/gi;
    this.suspiciousPatterns = [
      /discord\.gg\/[a-z0-9]+/gi,
      /bit\.ly\/[a-z0-9]+/gi,
      /free\s+(nitro|money|crypto)/gi,
      /@everyone|@here/gi,
      /\b(click|download|install)\s+(here|now)\b/gi
    ];
  }

  /**
   * Check if a message is spam
   * @param message Message content
   * @returns Spam check result
   */
  check(message: string): SpamCheckResult {
    // Check for URLs
    if (this.urlPattern.test(message)) {
      return {
        isSpam: true,
        reason: 'Message contains URLs'
      };
    }

    // Check for excessive length
    if (message.length > this.maxLength) {
      return {
        isSpam: true,
        reason: 'Message exceeds maximum length'
      };
    }

    // Check for suspicious patterns
    for (const pattern of this.suspiciousPatterns) {
      if (pattern.test(message)) {
        return {
          isSpam: true,
          reason: 'Message contains suspicious content'
        };
      }
    }

    // Check for excessive repetition
    if (this.hasExcessiveRepetition(message)) {
      return {
        isSpam: true,
        reason: 'Message contains excessive repetition'
      };
    }

    // Check for excessive caps
    if (this.hasExcessiveCaps(message)) {
      return {
        isSpam: true,
        reason: 'Message contains excessive capital letters'
      };
    }

    return { isSpam: false };
  }

  /**
   * Check if message has excessive repetition
   * @param message Message content
   * @returns True if excessive repetition detected
   */
  private hasExcessiveRepetition(message: string): boolean {
    const words = message.toLowerCase().split(/\s+/);
    if (words.length < 5) return false;

    const wordCounts = new Map<string, number>();
    for (const word of words) {
      if (word.length < 3) continue;
      wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
    }

    // Check if any word appears more than 50% of the time
    for (const count of wordCounts.values()) {
      if (count / words.length > 0.5) {
        return true;
      }
    }

    return false;
  }

  /**
   * Check if message has excessive capital letters
   * @param message Message content
   * @returns True if excessive caps detected
   */
  private hasExcessiveCaps(message: string): boolean {
    const letters = message.replace(/[^a-zA-Z]/g, '');
    if (letters.length < 10) return false;

    const capsCount = (message.match(/[A-Z]/g) || []).length;
    return capsCount / letters.length > 0.7;
  }

  /**
   * Allow a specific URL pattern
   * @param _pattern URL pattern to allow
   */
  allowUrlPattern(_pattern: RegExp): void {
    // In a real implementation, this would maintain a whitelist
    // For now, we'll just note it for future enhancement
  }

  /**
   * Add a suspicious pattern
   * @param pattern Pattern to add
   */
  addSuspiciousPattern(pattern: RegExp): void {
    this.suspiciousPatterns.push(pattern);
  }
}
