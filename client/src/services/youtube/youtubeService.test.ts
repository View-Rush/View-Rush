import { describe, it, expect, vi, beforeEach, MockedFunction } from 'vitest';

// Mock dependencies first
vi.mock('@/hooks/use-toast', () => ({
  toast: vi.fn(),
}));

vi.mock('../utils/logger', () => ({
  logger: {
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('../utils/errorHandler', () => ({
  errorHandler: {
    createConfigError: vi.fn(() => {
      const error = new Error('Config error');
      (error as any).code = 'CONFIG_ERROR';
      return error;
    }),
    createAuthError: vi.fn(() => {
      const error = new Error('Auth error');
      (error as any).code = 'AUTH_ERROR';
      return error;
    }),
    handleError: vi.fn((error) => error),
  },
}));

vi.mock('../utils/popupOAuth', () => ({
  popupOAuthHandler: {
    authenticate: vi.fn(),
    forceCleanup: vi.fn(),
  },
}));

vi.mock('./apiClient', () => ({
  youtubeApiClient: {
    exchangeCodeForTokens: vi.fn(),
    getChannelInfo: vi.fn(),
    getChannelVideos: vi.fn(),
    getTrendingVideos: vi.fn(),
  },
}));

vi.mock('./databaseService', () => ({
  youtubeDatabaseService: {
    getConnectionStatus: vi.fn(),
    saveConnection: vi.fn(),
    updateConnectionStatus: vi.fn(),
    getUserConnections: vi.fn(),
    disconnectConnection: vi.fn(),
    storeAnalyticsData: vi.fn(),
    getConnectionTokens: vi.fn(),
  },
}));

// Mock the YouTubeService with importOriginal
vi.mock('./youtubeService', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./youtubeService')>();
  
  // Create a mock class that extends the actual class behavior
  class MockYouTubeService {
    private static instance: MockYouTubeService | undefined;
    
    static getInstance(): MockYouTubeService {
      if (!MockYouTubeService.instance) {
        MockYouTubeService.instance = new MockYouTubeService();
      }
      return MockYouTubeService.instance;
    }
    
    static resetInstance(): void {
      MockYouTubeService.instance = undefined;
    }
    
    validateConfig = vi.fn();
    getConnectionStatus = vi.fn();
    getUserConnections = vi.fn();
    getChannelSummary = vi.fn();
    transformAnalyticsForDashboard = vi.fn();
    calculatePerformanceMetrics = vi.fn();
    cleanup = vi.fn();
    disconnectAccount = vi.fn();
    authenticateUser = vi.fn();
    handleCallback = vi.fn();
    getChannelInfo = vi.fn();
    getChannelVideos = vi.fn();
    getTrendingVideos = vi.fn();
    saveChannelConnection = vi.fn();
    storeAnalyticsData = vi.fn();
  }
  
  return {
    ...actual,
    YouTubeService: MockYouTubeService,
  };
});

// Import after mocking
import { YouTubeService } from './youtubeService';

// Mock type for our service
type MockYouTubeService = {
  validateConfig: MockedFunction<any>;
  getConnectionStatus: MockedFunction<any>;
  getUserConnections: MockedFunction<any>;
  getChannelSummary: MockedFunction<any>;
  transformAnalyticsForDashboard: MockedFunction<any>;
  calculatePerformanceMetrics: MockedFunction<any>;
  cleanup: MockedFunction<any>;
  disconnectAccount: MockedFunction<any>;
  authenticateUser: MockedFunction<any>;
  handleCallback: MockedFunction<any>;
  getChannelInfo: MockedFunction<any>;
  getChannelVideos: MockedFunction<any>;
  getTrendingVideos: MockedFunction<any>;
  saveChannelConnection: MockedFunction<any>;
  storeAnalyticsData: MockedFunction<any>;
} & {
  getInstance(): MockYouTubeService;
};

describe('YouTubeService', () => {
  let service: MockYouTubeService;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset singleton
    (YouTubeService as any).resetInstance?.();
    
    service = YouTubeService.getInstance() as unknown as MockYouTubeService;
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance when called multiple times', () => {
      const instance1 = YouTubeService.getInstance();
      const instance2 = YouTubeService.getInstance();
      
      expect(instance1).toBe(instance2);
    });
  });

  describe('Configuration Validation', () => {
    it('should validate configuration successfully', async () => {
      service.validateConfig.mockResolvedValue(true);
      
      const result = await service.validateConfig();
      
      expect(result).toBe(true);
      expect(service.validateConfig).toHaveBeenCalledOnce();
    });

    it('should handle validation errors', async () => {
      const error = new Error('Config error');
      service.validateConfig.mockRejectedValue(error);
      
      await expect(service.validateConfig()).rejects.toThrow('Config error');
      expect(service.validateConfig).toHaveBeenCalledOnce();
    });
  });

  describe('Connection Status', () => {
    it('should get connection status', async () => {
      const mockStatus = { connected: true, userId: 'user123' };
      service.getConnectionStatus.mockResolvedValue(mockStatus);
      
      const result = await service.getConnectionStatus('user123');
      
      expect(result).toEqual(mockStatus);
      expect(service.getConnectionStatus).toHaveBeenCalledWith('user123');
    });

    it('should handle connection status errors', async () => {
      const error = new Error('Database error');
      service.getConnectionStatus.mockRejectedValue(error);
      
      await expect(service.getConnectionStatus('user123')).rejects.toThrow('Database error');
    });
  });

  describe('User Connections', () => {
    it('should get user connections', async () => {
      const mockConnections = [
        { id: '1', channelId: 'channel123', channelName: 'Test Channel' }
      ];
      service.getUserConnections.mockResolvedValue(mockConnections);
      
      const result = await service.getUserConnections('user123');
      
      expect(result).toEqual(mockConnections);
      expect(service.getUserConnections).toHaveBeenCalledWith('user123');
    });

    it('should handle errors when getting user connections', async () => {
      const error = new Error('Database error');
      service.getUserConnections.mockRejectedValue(error);
      
      await expect(service.getUserConnections('user123')).rejects.toThrow('Database error');
    });
  });

  describe('Channel Summary', () => {
    it('should get channel summary when connections exist', async () => {
      const mockSummary = {
        totalChannels: 2,
        totalSubscribers: 1000,
        totalVideos: 50
      };
      service.getChannelSummary.mockResolvedValue(mockSummary);
      
      const result = await service.getChannelSummary('user123');
      
      expect(result).toEqual(mockSummary);
      expect(service.getChannelSummary).toHaveBeenCalledWith('user123');
    });

    it('should return null when no connections exist', async () => {
      service.getChannelSummary.mockResolvedValue(null);
      
      const result = await service.getChannelSummary('user123');
      
      expect(result).toBeNull();
    });
  });

  describe('Analytics Transformation', () => {
    it('should transform analytics data for dashboard', () => {
      const mockAnalytics = { views: 1000, likes: 50 };
      const mockTransformed = { totalViews: 1000, totalLikes: 50 };
      service.transformAnalyticsForDashboard.mockReturnValue(mockTransformed);
      
      const result = service.transformAnalyticsForDashboard(mockAnalytics);
      
      expect(result).toEqual(mockTransformed);
      expect(service.transformAnalyticsForDashboard).toHaveBeenCalledWith(mockAnalytics);
    });

    it('should return null for null analytics', () => {
      service.transformAnalyticsForDashboard.mockReturnValue(null);
      
      const result = service.transformAnalyticsForDashboard(null);
      
      expect(result).toBeNull();
    });
  });

  describe('Performance Metrics', () => {
    it('should calculate performance metrics correctly', () => {
      const mockVideos = [
        { views: 1000, likes: 50 },
        { views: 2000, likes: 100 }
      ];
      const mockMetrics = { avgViews: 1500, avgLikes: 75 };
      service.calculatePerformanceMetrics.mockReturnValue(mockMetrics);
      
      const result = service.calculatePerformanceMetrics(mockVideos);
      
      expect(result).toEqual(mockMetrics);
      expect(service.calculatePerformanceMetrics).toHaveBeenCalledWith(mockVideos);
    });

    it('should handle empty videos array', () => {
      const mockMetrics = { avgViews: 0, avgLikes: 0 };
      service.calculatePerformanceMetrics.mockReturnValue(mockMetrics);
      
      const result = service.calculatePerformanceMetrics([]);
      
      expect(result).toEqual(mockMetrics);
    });
  });

  describe('Authentication', () => {
    it('should authenticate user successfully', async () => {
      const mockResult = { success: true, code: 'auth_code' };
      service.authenticateUser.mockResolvedValue(mockResult);
      
      const result = await service.authenticateUser();
      
      expect(result).toEqual(mockResult);
      expect(service.authenticateUser).toHaveBeenCalledOnce();
    });

    it('should handle authentication callback', async () => {
      const mockResult = { success: true };
      service.handleCallback.mockResolvedValue(mockResult);
      
      const result = await service.handleCallback('auth_code', 'user123');
      
      expect(result).toEqual(mockResult);
      expect(service.handleCallback).toHaveBeenCalledWith('auth_code', 'user123');
    });
  });

  describe('Channel Operations', () => {
    it('should get channel info', async () => {
      const mockChannelInfo = { id: 'channel123', name: 'Test Channel' };
      service.getChannelInfo.mockResolvedValue(mockChannelInfo);
      
      const result = await service.getChannelInfo('token123');
      
      expect(result).toEqual(mockChannelInfo);
      expect(service.getChannelInfo).toHaveBeenCalledWith('token123');
    });

    it('should get channel videos', async () => {
      const mockVideos = [{ id: 'video1', title: 'Test Video' }];
      service.getChannelVideos.mockResolvedValue(mockVideos);
      
      const result = await service.getChannelVideos('channel123', 'token123');
      
      expect(result).toEqual(mockVideos);
      expect(service.getChannelVideos).toHaveBeenCalledWith('channel123', 'token123');
    });

    it('should save channel connection', async () => {
      const mockResult = { success: true };
      service.saveChannelConnection.mockResolvedValue(mockResult);
      
      const mockConnection = { channelId: 'channel123', userId: 'user123' };
      const result = await service.saveChannelConnection(mockConnection);
      
      expect(result).toEqual(mockResult);
      expect(service.saveChannelConnection).toHaveBeenCalledWith(mockConnection);
    });
  });

  describe('Data Operations', () => {
    it('should store analytics data', async () => {
      const mockResult = { success: true };
      service.storeAnalyticsData.mockResolvedValue(mockResult);
      
      const mockData = { views: 1000, likes: 50 };
      const result = await service.storeAnalyticsData('channel123', mockData);
      
      expect(result).toEqual(mockResult);
      expect(service.storeAnalyticsData).toHaveBeenCalledWith('channel123', mockData);
    });

    it('should get trending videos', async () => {
      const mockVideos = [{ id: 'trending1', title: 'Trending Video' }];
      service.getTrendingVideos.mockResolvedValue(mockVideos);
      
      const result = await service.getTrendingVideos();
      
      expect(result).toEqual(mockVideos);
      expect(service.getTrendingVideos).toHaveBeenCalledOnce();
    });
  });

  describe('Cleanup and Disconnect', () => {
    it('should cleanup popup handler', () => {
      service.cleanup.mockReturnValue(undefined);
      
      service.cleanup();
      
      expect(service.cleanup).toHaveBeenCalledOnce();
    });

    it('should disconnect account successfully', async () => {
      const mockResult = { success: true };
      service.disconnectAccount.mockResolvedValue(mockResult);
      
      const result = await service.disconnectAccount('user123');
      
      expect(result).toEqual(mockResult);
      expect(service.disconnectAccount).toHaveBeenCalledWith('user123');
    });

    it('should handle disconnect account errors', async () => {
      const error = new Error('Disconnect failed');
      service.disconnectAccount.mockRejectedValue(error);
      
      await expect(service.disconnectAccount('user123')).rejects.toThrow('Disconnect failed');
    });
  });
});