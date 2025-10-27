import { auth } from './firebase';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

async function getAuthToken(): Promise<string | null> {
  const user = auth.currentUser;
  if (!user) return null;
  return await user.getIdToken();
}

export interface UsageData {
  monthlyCount: number;
  remainingQuota: number;
  tier: 'free' | 'pro';
}

export interface ServerLinkRequest {
  whopToken: string;
  serverId: string;
}

export interface ServerLinkResponse {
  success: boolean;
  tier: 'free' | 'pro';
  message: string;
}

export interface UploadKBRequest {
  serverId: string;
  file: File;
}

export interface UploadKBResponse {
  success: boolean;
  message: string;
  fileId?: string;
}

export interface TrendsData {
  totalQuestions: number;
  averageResponseTime: number;
  topTopics: Array<{ topic: string; count: number }>;
  dailyUsage: Array<{ date: string; count: number }>;
}

export const api = {
  async getUsage(serverId: string): Promise<UsageData> {
    const token = await getAuthToken();
    const response = await fetch(`${API_BASE_URL}/usage?serverId=${serverId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch usage: ${response.statusText}`);
    }

    return response.json();
  },

  async linkServer(data: ServerLinkRequest): Promise<ServerLinkResponse> {
    const token = await getAuthToken();
    const response = await fetch(`${API_BASE_URL}/link-server`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Failed to link server: ${response.statusText}`);
    }

    return response.json();
  },

  async uploadKB(data: UploadKBRequest): Promise<UploadKBResponse> {
    const token = await getAuthToken();
    const formData = new FormData();
    formData.append('file', data.file);
    formData.append('serverId', data.serverId);

    const response = await fetch(`${API_BASE_URL}/upload-kb`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Failed to upload file: ${response.statusText}`);
    }

    return response.json();
  },

  async getTrends(serverId: string): Promise<TrendsData> {
    const token = await getAuthToken();
    const response = await fetch(`${API_BASE_URL}/trends?serverId=${serverId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch trends: ${response.statusText}`);
    }

    return response.json();
  },

  async exchangeWhopToken(whopToken: string): Promise<{ firebaseToken: string }> {
    const response = await fetch(`${API_BASE_URL}/auth/whop-exchange`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ whopToken }),
    });

    if (!response.ok) {
      throw new Error(`Failed to exchange Whop token: ${response.statusText}`);
    }

    return response.json();
  },
};
