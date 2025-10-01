import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock all dependencies first
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
    rpc: vi.fn(),
  },
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
    createAuthError: vi.fn((message: string) => new Error(message)),
    createDatabaseError: vi.fn((message: string) => new Error(message)),
    handleError: vi.fn((error: unknown) => error),
  },
}));

vi.mock('@/services/authHelper', () => ({
  authHelper: {
    getUser: vi.fn(),
  },
}));

vi.mock('@/services/secureTokenService', () => ({
  SecureTokenService: {
    storeTokens: vi.fn(),
    getTokens: vi.fn(),
  },
}));

// Now import
import { YouTubeDatabaseService } from './databaseService';
import { supabase } from '@/integrations/supabase/client';
import { authHelper } from '@/services/authHelper';
import { SecureTokenService } from '@/services/secureTokenService';

const mockSupabase = vi.mocked(supabase);
const mockAuthHelper = vi.mocked(authHelper);
const mockSecureTokenService = vi.mocked(SecureTokenService);

vi.spyOn(console, 'log').mockImplementation(() => {});

describe('YouTubeDatabaseService', () => {
  let databaseService: YouTubeDatabaseService;

  beforeEach(() => {
    (YouTubeDatabaseService as any).instance = undefined;
    databaseService = YouTubeDatabaseService.getInstance();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance when called multiple times', () => {
      const instance1 = YouTubeDatabaseService.getInstance();
      const instance2 = YouTubeDatabaseService.getInstance();
      
      expect(instance1).toBe(instance2);
      expect(instance1).toBe(databaseService);
    });
  });

  describe('getConnectionStatus', () => {
    it('should throw error when user is not authenticated', async () => {
      mockAuthHelper.getUser.mockResolvedValue(null);
      
      await expect(databaseService.getConnectionStatus()).rejects.toThrow('User not authenticated');
    });

    it('should return connection status for authenticated user', async () => {
      const mockUser = { 
        id: 'user-123', 
        email: 'test@example.com',
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        created_at: '2024-01-01T00:00:00Z',
      };
      
      mockAuthHelper.getUser.mockResolvedValue(mockUser);
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: [], error: null }),
      } as any);

      const result = await databaseService.getConnectionStatus();
      
      expect(result.isConnected).toBe(false);
      expect(mockSupabase.from).toHaveBeenCalledWith('channel_connections');
    });
  });

  describe('getUserConnections', () => {
    it('should throw error when user is not authenticated', async () => {
      mockAuthHelper.getUser.mockResolvedValue(null);
      
      await expect(databaseService.getUserConnections()).rejects.toThrow('User not authenticated');
    });

    it('should return user connections', async () => {
      const mockUser = { 
        id: 'user-123', 
        email: 'test@example.com',
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        created_at: '2024-01-01T00:00:00Z',
      };
      
      const mockConnections = [
        { id: 'conn-1', channel_name: 'Channel 1', is_active: true },
      ];
      
      mockAuthHelper.getUser.mockResolvedValue(mockUser);
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockConnections, error: null }),
      } as any);

      const result = await databaseService.getUserConnections();
      
      expect(result).toEqual(mockConnections);
    });
  });

  describe('storeAnalyticsData', () => {
    it('should store analytics data successfully', async () => {
      const analyticsData = {
        subscriber_count: 1000,
        view_count: 50000,
        video_count: 10,
        performance_metrics: {
          engagement_rate: 5.2,
        },
        raw_data: {},
      };
      
      mockSupabase.rpc.mockResolvedValue({ data: null, error: null });

      await databaseService.storeAnalyticsData('conn-123', analyticsData);
      
      expect(mockSupabase.rpc).toHaveBeenCalledWith('update_channel_analytics', {
        connection_uuid: 'conn-123',
        analytics_data: expect.objectContaining(analyticsData),
      });
    });

    it('should handle analytics storage errors', async () => {
      const analyticsData = {
        subscriber_count: 1000,
        view_count: 50000,
        video_count: 10,
        performance_metrics: {},
      };
      
      mockSupabase.rpc.mockResolvedValue({ data: null, error: 'Storage failed' });

      await expect(
        databaseService.storeAnalyticsData('conn-123', analyticsData)
      ).rejects.toThrow();
    });
  });

  describe('getConnectionTokens', () => {
    it('should retrieve connection tokens', async () => {
      const mockTokens = {
        access_token: 'test-token',
        refresh_token: 'refresh-token',
      };
      
      mockSecureTokenService.getTokens.mockResolvedValue(mockTokens);

      const result = await databaseService.getConnectionTokens('conn-123');
      
      expect(result).toEqual(mockTokens);
      expect(mockSecureTokenService.getTokens).toHaveBeenCalledWith('conn-123');
    });

    it('should return null when no tokens found', async () => {
      mockSecureTokenService.getTokens.mockResolvedValue(null);

      const result = await databaseService.getConnectionTokens('conn-123');
      
      expect(result).toBeNull();
    });
  });

  describe('updateConnectionStatus', () => {
    it('should update connection status', async () => {
      mockSupabase.from.mockReturnValue({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null }),
      } as any);

      await databaseService.updateConnectionStatus('conn-123', true);
      
      expect(mockSupabase.from).toHaveBeenCalledWith('channel_connections');
    });

    it('should handle update errors', async () => {
      mockSupabase.from.mockReturnValue({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: new Error('Update failed') }),
      } as any);

      await expect(
        databaseService.updateConnectionStatus('conn-123', true)
      ).rejects.toThrow();
    });
  });
});