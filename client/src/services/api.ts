// API service for communication with FastAPI backend
import { supabase } from '@/integrations/supabase/client';

const API_BASE_URL = import.meta.env.VITE_API_URL;
if (!API_BASE_URL) {
  throw new Error('VITE_API_URL environment variable is not set. Please configure it to match your backend server URL.');
}

interface ApiRequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: any;
  headers?: Record<string, string>;
}

class ApiService {
  private async getAuthHeaders(): Promise<Record<string, string>> {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.access_token) {
      throw new Error('No active session');
    }

    return {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    };
  }

  private async makeRequest<T>(endpoint: string, config: ApiRequestConfig = {}): Promise<T> {
    const { method = 'GET', body, headers = {} } = config;
    
    try {
      const authHeaders = await this.getAuthHeaders();
      
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method,
        headers: {
          ...authHeaders,
          ...headers,
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  // Analytics endpoints
  async getYouTubeAnalytics() {
    return this.makeRequest('/analytics/youtube');
  }

  async getChannelAnalytics(channelId: string) {
    return this.makeRequest(`/analytics/channel/${channelId}`);
  }

  // Predictions endpoints
  async getPredictions(channelData: any) {
    return this.makeRequest('/predictions', {
      method: 'POST',
      body: channelData,
    });
  }

  async getOptimalPublishTimes(channelId: string) {
    return this.makeRequest(`/predictions/optimal-times/${channelId}`);
  }

  // User profiling endpoints
  async getUserProfile() {
    return this.makeRequest('/users/profile');
  }

  async updateUserProfile(profileData: any) {
    return this.makeRequest('/users/profile', {
      method: 'PUT',
      body: profileData,
    });
  }

  async getUserPreferences() {
    return this.makeRequest('/users/preferences');
  }

  async updateUserPreferences(preferences: any) {
    return this.makeRequest('/users/preferences', {
      method: 'PUT',
      body: preferences,
    });
  }

  // Machine Learning endpoints
  async getRecommendations(userId: string) {
    return this.makeRequest(`/ml/recommendations/${userId}`);
  }

  async getTrendingTopics() {
    return this.makeRequest('/ml/trending-topics');
  }

  async getContentSuggestions(channelData: any) {
    return this.makeRequest('/ml/content-suggestions', {
      method: 'POST',
      body: channelData,
    });
  }
}

export const apiService = new ApiService();
