import axios, { AxiosInstance } from 'axios';
import NodeCache from 'node-cache';

interface WhopUser {
  id: string;
  email: string;
  username: string;
}

interface WhopMembership {
  id: string;
  user_id: string;
  product_id: string;
  plan_id: string;
  status: 'active' | 'expired' | 'cancelled';
  valid: boolean;
  expires_at: number | null;
}

interface WhopValidationResponse {
  valid: boolean;
  user?: WhopUser;
  memberships?: WhopMembership[];
}

export class WhopService {
  private client: AxiosInstance;
  private cache: NodeCache;
  private apiKey: string;
  private productId: string;

  constructor() {
    this.apiKey = process.env.WHOP_API_KEY || '';
    this.productId = process.env.WHOP_PRODUCT_ID || '';
    
    if (!this.apiKey) {
      console.warn('WHOP_API_KEY not set - Whop integration disabled');
    }

    this.client = axios.create({
      baseURL: 'https://api.whop.com/v2',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });

    this.cache = new NodeCache({ stdTTL: 300, checkperiod: 60 });
  }

  async validateToken(token: string): Promise<WhopValidationResponse> {
    const cacheKey = `whop_token_${token}`;
    const cached = this.cache.get<WhopValidationResponse>(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      const response = await this.client.get('/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const user: WhopUser = response.data;
      const memberships = await this.getUserMemberships(token);

      const result: WhopValidationResponse = {
        valid: true,
        user,
        memberships,
      };

      this.cache.set(cacheKey, result);
      return result;
    } catch (error) {
      console.error('Whop token validation error:', error);
      return { valid: false };
    }
  }

  async getUserMemberships(token: string): Promise<WhopMembership[]> {
    try {
      const response = await this.client.get('/me/memberships', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching Whop memberships:', error);
      return [];
    }
  }

  async hasActiveSubscription(token: string): Promise<boolean> {
    const validation = await this.validateToken(token);
    
    if (!validation.valid || !validation.memberships) {
      return false;
    }

    return validation.memberships.some(
      (membership) =>
        membership.status === 'active' &&
        membership.valid &&
        (this.productId === '' || membership.product_id === this.productId)
    );
  }

  async getSubscriptionTier(token: string): Promise<'free' | 'pro'> {
    const hasSubscription = await this.hasActiveSubscription(token);
    return hasSubscription ? 'pro' : 'free';
  }

  async getCustomerId(token: string): Promise<string | null> {
    const validation = await this.validateToken(token);
    return validation.user?.id || null;
  }

  async getSubscriptionExpiration(token: string): Promise<number | null> {
    const validation = await this.validateToken(token);
    
    if (!validation.valid || !validation.memberships) {
      return null;
    }

    const activeMembership = validation.memberships.find(
      (m) => m.status === 'active' && m.valid
    );

    return activeMembership?.expires_at || null;
  }

  clearCache(token?: string): void {
    if (token) {
      this.cache.del(`whop_token_${token}`);
    } else {
      this.cache.flushAll();
    }
  }
}

export const whopService = new WhopService();
