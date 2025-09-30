import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Unmock the API service to test the real implementation
vi.unmock('@/services/api');

describe('ApiService', () => {
  let apiService: any;
  let mockFetch: any;
  let mockSupabase: any;

  beforeEach(async () => {
    // Reset all mocks
    vi.clearAllMocks();
    vi.resetModules();

    // Mock fetch
    mockFetch = vi.fn();
    global.fetch = mockFetch;

    // Mock supabase
    mockSupabase = {
      auth: {
        getSession: vi.fn(),
      },
    };

    // Mock environment variables
    vi.stubEnv('VITE_API_URL', 'https://api.example.com');

    // Mock supabase client
    vi.doMock('@/integrations/supabase/client', () => ({
      supabase: mockSupabase,
    }));

    // Import API service after mocks are set up
    const apiModule = await import('@/services/api');
    apiService = apiModule.apiService;
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.doUnmock('@/integrations/supabase/client');
  });
  const mockSession = {
    access_token: 'mock-access-token',
    user: {
      id: 'test-user',
      email: 'test@example.com',
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: mockSession },
      error: null,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Authentication', () => {
    it('should include authorization headers in requests', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({ data: 'test' }),
      };
      mockFetch.mockResolvedValue(mockResponse);

      await apiService.getYouTubeAnalytics();

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/analytics/youtube',
        {
          method: 'GET',
          headers: {
            'Authorization': 'Bearer mock-access-token',
            'Content-Type': 'application/json',
          },
          body: undefined,
        }
      );
    });

    it('should throw error when no active session', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null,
      });

      await expect(apiService.getYouTubeAnalytics()).rejects.toThrow('No active session');
    });

    it('should handle session errors', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: { message: 'Session error' },
      });

      await expect(apiService.getYouTubeAnalytics()).rejects.toThrow('No active session');
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });
    });

    it('should handle HTTP errors', async () => {
      const mockResponse = {
        ok: false,
        status: 404,
        json: vi.fn().mockResolvedValue({ detail: 'Not found' }),
      };
      mockFetch.mockResolvedValue(mockResponse);

      await expect(apiService.getYouTubeAnalytics()).rejects.toThrow('Not found');
    });

    it('should handle HTTP errors without error details', async () => {
      const mockResponse = {
        ok: false,
        status: 500,
        json: vi.fn().mockRejectedValue(new Error('Invalid JSON')),
      };
      mockFetch.mockResolvedValue(mockResponse);

      await expect(apiService.getYouTubeAnalytics()).rejects.toThrow('HTTP error! status: 500');
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      await expect(apiService.getYouTubeAnalytics()).rejects.toThrow('Network error');
    });

    it('should handle JSON parsing errors', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockRejectedValue(new Error('Invalid JSON')),
      };
      mockFetch.mockResolvedValue(mockResponse);

      await expect(apiService.getYouTubeAnalytics()).rejects.toThrow('Invalid JSON');
    });
  });

  describe('Analytics Endpoints', () => {
    beforeEach(() => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({ data: 'mock-data' }),
      };
      mockFetch.mockResolvedValue(mockResponse);
    });

    it('should call getYouTubeAnalytics correctly', async () => {
      const result = await apiService.getYouTubeAnalytics();

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/analytics/youtube',
        expect.objectContaining({
          method: 'GET',
        })
      );
      expect(result).toEqual({ data: 'mock-data' });
    });

    it('should call getChannelAnalytics with channel ID', async () => {
      const channelId = 'test-channel-id';
      const result = await apiService.getChannelAnalytics(channelId);

      expect(mockFetch).toHaveBeenCalledWith(
        `https://api.example.com/analytics/channel/${channelId}`,
        expect.objectContaining({
          method: 'GET',
        })
      );
      expect(result).toEqual({ data: 'mock-data' });
    });
  });

  describe('Predictions Endpoints', () => {
    beforeEach(() => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({ predictions: 'mock-predictions' }),
      };
      mockFetch.mockResolvedValue(mockResponse);
    });

    it('should call getPredictions with POST data', async () => {
      const channelData = { channelId: 'test', metrics: {} };
      const result = await apiService.getPredictions(channelData);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/predictions',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(channelData),
        })
      );
      expect(result).toEqual({ predictions: 'mock-predictions' });
    });

    it('should call getOptimalPublishTimes with channel ID', async () => {
      const channelId = 'test-channel-id';
      const result = await apiService.getOptimalPublishTimes(channelId);

      expect(mockFetch).toHaveBeenCalledWith(
        `https://api.example.com/predictions/optimal-times/${channelId}`,
        expect.objectContaining({
          method: 'GET',
        })
      );
      expect(result).toEqual({ predictions: 'mock-predictions' });
    });
  });

  describe('User Profile Endpoints', () => {
    beforeEach(() => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({ profile: 'mock-profile' }),
      };
      mockFetch.mockResolvedValue(mockResponse);
    });

    it('should call getUserProfile', async () => {
      const result = await apiService.getUserProfile();

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/users/profile',
        expect.objectContaining({
          method: 'GET',
        })
      );
      expect(result).toEqual({ profile: 'mock-profile' });
    });

    it('should call updateUserProfile with PUT data', async () => {
      const profileData = { name: 'John Doe', bio: 'Test bio' };
      const result = await apiService.updateUserProfile(profileData);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/users/profile',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(profileData),
        })
      );
      expect(result).toEqual({ profile: 'mock-profile' });
    });

    it('should call getUserPreferences', async () => {
      const result = await apiService.getUserPreferences();

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/users/preferences',
        expect.objectContaining({
          method: 'GET',
        })
      );
      expect(result).toEqual({ profile: 'mock-profile' });
    });

    it('should call updateUserPreferences with PUT data', async () => {
      const preferences = { theme: 'dark', notifications: true };
      const result = await apiService.updateUserPreferences(preferences);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/users/preferences',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(preferences),
        })
      );
      expect(result).toEqual({ profile: 'mock-profile' });
    });
  });

  describe('Machine Learning Endpoints', () => {
    beforeEach(() => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({ ml: 'mock-ml-data' }),
      };
      mockFetch.mockResolvedValue(mockResponse);
    });

    it('should call getRecommendations with user ID', async () => {
      const userId = 'test-user-id';
      const result = await apiService.getRecommendations(userId);

      expect(mockFetch).toHaveBeenCalledWith(
        `https://api.example.com/ml/recommendations/${userId}`,
        expect.objectContaining({
          method: 'GET',
        })
      );
      expect(result).toEqual({ ml: 'mock-ml-data' });
    });

    it('should call getTrendingTopics', async () => {
      const result = await apiService.getTrendingTopics();

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/ml/trending-topics',
        expect.objectContaining({
          method: 'GET',
        })
      );
      expect(result).toEqual({ ml: 'mock-ml-data' });
    });

    it('should call getContentSuggestions with POST data', async () => {
      const channelData = { channelId: 'test', content: 'test content' };
      const result = await apiService.getContentSuggestions(channelData);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/ml/content-suggestions',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(channelData),
        })
      );
      expect(result).toEqual({ ml: 'mock-ml-data' });
    });
  });

  describe('Request Configuration', () => {
    it('should merge custom headers with auth headers', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({ data: 'test' }),
      };
      mockFetch.mockResolvedValue(mockResponse);

      // Use internal makeRequest method through a public method that allows custom headers
      const profileData = { name: 'Test' };
      await apiService.updateUserProfile(profileData);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer mock-access-token',
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    it('should handle GET requests without body', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({ data: 'test' }),
      };
      mockFetch.mockResolvedValue(mockResponse);

      await apiService.getUserProfile();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: undefined,
        })
      );
    });

    it('should stringify body for POST/PUT requests', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({ data: 'test' }),
      };
      mockFetch.mockResolvedValue(mockResponse);

      const testData = { test: 'data' };
      await apiService.updateUserProfile(testData);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify(testData),
        })
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty response body', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue(null),
      };
      mockFetch.mockResolvedValue(mockResponse);

      const result = await apiService.getUserProfile();
      expect(result).toBeNull();
    });

    it('should handle undefined body in requests', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({ data: 'test' }),
      };
      mockFetch.mockResolvedValue(mockResponse);

      await apiService.getUserProfile();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: undefined,
        })
      );
    });

    it('should handle malformed session data', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: { access_token: null } },
        error: null,
      });

      await expect(apiService.getYouTubeAnalytics()).rejects.toThrow('No active session');
    });
  });
});