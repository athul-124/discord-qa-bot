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

  constructor(whopApiKey: string) {
    this.whopApiKey = whopApiKey;
    this.tierFeatures = new Map([
      ['free', {
        monthlyMessageLimit: 10,
        prioritySupport: false,
        advancedFeatures: false,
        customResponses: false
      }],
      ['pro', {
        monthlyMessageLimit: 1000,
        prioritySupport: true,
        advancedFeatures: true,
        customResponses: true
      }]
    ]);
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
}
