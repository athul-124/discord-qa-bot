import NodeCache from 'node-cache';
import { configService } from './configService';
import { whopService } from './whopService';

export interface SubscriptionInfo {
  userId: string;
  tier: 'free' | 'pro';
  isActive: boolean;
  expiresAt?: Date;
  features: SubscriptionFeatures;
}

export interface SubscriptionFeatures {
  monthlyMessageLimit: number;
  prioritySupport: boolean;
  advancedFeatures: boolean;
  customResponses: boolean;
}

export class SubscriptionService {
  private whopApiKey: string;
  private tierFeatures: Map<string, SubscriptionFeatures>;
  private cache: NodeCache;

  constructor(whopApiKey: string) {
    this.whopApiKey = whopApiKey;
    this.cache = new NodeCache({ stdTTL: 300, checkperiod: 60 });
    this.tierFeatures = new Map([
      ['free', {
        monthlyMessageLimit: 100,
        prioritySupport: false,
        advancedFeatures: false,
        customResponses: false
      }],
      ['pro', {
        monthlyMessageLimit: 999999,
        prioritySupport: true,
        advancedFeatures: true,
        customResponses: true
      }]
    ]);
  }

  /**
   * Check subscription status for a guild
   * @param guildId Guild/Server ID
   * @returns Subscription tier ('free' or 'pro')
   */
  async checkSub(guildId: string): Promise<'free' | 'pro'> {
    const cacheKey = `sub_${guildId}`;
    const cached = this.cache.get<'free' | 'pro'>(cacheKey);
    
    if (cached) {
      return cached;
    }

    const tier = configService.getTier(guildId);
    const config = configService.getConfig(guildId);

    if (config?.whopToken && tier === 'pro') {
      try {
        const hasActive = await whopService.hasActiveSubscription(config.whopToken);
        const result = hasActive ? 'pro' : 'free';
        
        if (!hasActive) {
          configService.setConfig(guildId, { tier: 'free' });
        }
        
        this.cache.set(cacheKey, result);
        return result;
      } catch (error) {
        console.error(`[SubscriptionService] Error checking Whop subscription for ${guildId}:`, error);
        this.cache.set(cacheKey, tier);
        return tier;
      }
    }

    this.cache.set(cacheKey, tier);
    return tier;
  }

  /**
   * Get subscription information for a user
   * @param userId User ID
   * @returns Subscription information
   */
  async getSubscription(userId: string): Promise<SubscriptionInfo> {
    // In production, this would call the Whop API
    // For now, return default free tier
    const tier = 'free';
    const features = this.tierFeatures.get(tier)!;

    return {
      userId,
      tier,
      isActive: true,
      features
    };
  }

  /**
   * Check if user has access to a feature
   * @param userId User ID
   * @param feature Feature name
   * @returns True if user has access
   */
  async hasFeature(userId: string, feature: keyof SubscriptionFeatures): Promise<boolean> {
    const subscription = await this.getSubscription(userId);
    
    if (!subscription.isActive) {
      return false;
    }

    return subscription.features[feature] as boolean;
  }

  /**
   * Check if user has pro subscription
   * @param userId User ID
   * @returns True if user has pro tier
   */
  async isPro(userId: string): Promise<boolean> {
    const subscription = await this.getSubscription(userId);
    return subscription.isActive && subscription.tier === 'pro';
  }

  /**
   * Get monthly message limit for user
   * @param userId User ID
   * @returns Monthly message limit
   */
  async getMessageLimit(userId: string): Promise<number> {
    const subscription = await this.getSubscription(userId);
    return subscription.features.monthlyMessageLimit;
  }

  /**
   * Verify subscription with Whop API
   * @param userId User ID
   * @param whopMembershipId Whop membership ID
   * @returns Subscription tier or null if invalid
   */
  async verifyWhopSubscription(userId: string, whopMembershipId: string): Promise<'free' | 'pro' | null> {
    // In production, this would make an API call to Whop
    // Mock implementation for testing
    if (!this.whopApiKey || this.whopApiKey === 'test_whop_key') {
      return 'free';
    }

    try {
      // Mock API call
      // const response = await fetch(`https://api.whop.com/v1/memberships/${whopMembershipId}`, {
      //   headers: { 'Authorization': `Bearer ${this.whopApiKey}` }
      // });
      // const data = await response.json();
      // return data.tier;

      return 'free';
    } catch (error) {
      console.error('Error verifying Whop subscription:', error);
      return null;
    }
  }

  /**
   * Get features for a tier
   * @param tier Subscription tier
   * @returns Features for the tier
   */
  getFeatures(tier: 'free' | 'pro'): SubscriptionFeatures {
    return this.tierFeatures.get(tier)!;
  }

  /**
   * Check if subscription is expired
   * @param subscription Subscription info
   * @returns True if expired
   */
  isExpired(subscription: SubscriptionInfo): boolean {
    if (!subscription.expiresAt) {
      return false;
    }

    return new Date() > subscription.expiresAt;
  }

  clearCache(guildId?: string): void {
    if (guildId) {
      this.cache.del(`sub_${guildId}`);
    } else {
      this.cache.flushAll();
    }
  }
}

export const subscriptionService = new SubscriptionService(process.env.WHOP_API_KEY || '');
