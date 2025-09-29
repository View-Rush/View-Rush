import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { DashboardProvider, useDashboard } from '@/contexts/DashboardContext';
import { ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useChannelConnections } from '@/hooks/useChannelConnections';
import { youtubeService } from '@/services/youtube';
import { connectionStateManager } from '@/services/connectionStateManager';
import { toast } from '@/hooks/use-toast';

// Mock dependencies with proper hoisting
vi.mock('@/hooks/useAuth');
vi.mock('@/hooks/useChannelConnections');
vi.mock('@/services/youtube', () => ({
  youtubeService: {
    getDashboardAnalytics: vi.fn(),
  },
}));
vi.mock('@/services/connectionStateManager', () => ({
  connectionStateManager: {
    initializeFromSupabase: vi.fn(),
    getState: vi.fn(),
    isConnecting: vi.fn(() => false),
  },
}));
vi.mock('@/hooks/use-toast', () => ({
  toast: vi.fn(),
}));

describe('DashboardContext', () => {
  // Get mocked functions
  const mockUseAuth = vi.mocked(useAuth);
  const mockUseChannelConnections = vi.mocked(useChannelConnections);
  const mockYoutubeService = vi.mocked(youtubeService);
  const mockConnectionStateManager = vi.mocked(connectionStateManager);
  const mockToast = vi.mocked(toast);

  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
    user_metadata: { display_name: 'Test User' },
    app_metadata: {},
    aud: 'authenticated',
    created_at: '2023-01-01T00:00:00.000Z',
    updated_at: '2023-01-01T00:00:00.000Z',
  };

  const mockConnections = [
    {
      id: 'connection-1',
      channel_id: 'channel-1',
      channel_title: 'Test Channel',
      subscriber_count: 1000,
      video_count: 50,
    },
  ];

  const mockAnalyticsData = {
    channel_stats: {
      subscriber_count: 1000,
      total_views: 50000,
      total_videos: 50,
      average_views_per_video: 1000,
    },
    recent_videos: [
      {
        id: 'video-1',
        title: 'Test Video',
        views: 1500,
        likes: 100,
        comments: 20,
        published_at: '2023-01-01T12:00:00Z',
      },
    ],
    performance_metrics: {
      best_performing_time: '14:00',
      best_performing_day: 'Tuesday',
      average_engagement_rate: 5.5,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockUseAuth.mockReturnValue({
      user: mockUser,
      loading: false,
    });

    mockUseChannelConnections.mockReturnValue({
      connections: mockConnections,
      loading: false,
      connecting: false,
      connectChannel: vi.fn(),
      disconnectChannel: vi.fn(),
      refreshConnection: vi.fn(),
      hasConnections: true,
    });

    mockYoutubeService.getDashboardAnalytics.mockResolvedValue(mockAnalyticsData);
    mockConnectionStateManager.initializeFromSupabase.mockResolvedValue(undefined);
    mockConnectionStateManager.getState.mockReturnValue({});
    mockConnectionStateManager.isConnecting.mockReturnValue(false);
  });

  const createWrapper = () => ({ children }: { children: ReactNode }) => (
    <DashboardProvider>{children}</DashboardProvider>
  );

  describe('Context Provider', () => {
    it('should provide dashboard context to children', () => {
      const { result } = renderHook(() => useDashboard(), {
        wrapper: createWrapper(),
      });

      expect(result.current).toBeDefined();
      expect(typeof result.current.refreshData).toBe('function');
      expect(typeof result.current.connectChannel).toBe('function');
      expect(typeof result.current.disconnectChannel).toBe('function');
    });

    it('should throw error when used outside provider', () => {
      expect(() => {
        renderHook(() => useDashboard());
      }).toThrow('useDashboard must be used within a DashboardProvider');
    });
  });

  describe('Initial State', () => {
    it('should initialize with correct default values', () => {
      const { result } = renderHook(() => useDashboard(), {
        wrapper: createWrapper(),
      });

      expect(result.current.analyticsData).toBeNull();
      expect(result.current.predictionsData).toBeNull();
      expect(result.current.loading).toBe(true); // Loading starts immediately when user and connections exist
      expect(result.current.hasConnections).toBe(true);
      expect(result.current.channelConnections).toEqual(mockConnections);
    });

    it('should handle no connections state', () => {
      mockUseChannelConnections.mockReturnValue({
        connections: [],
        loading: false,
        connecting: false,
        connectChannel: vi.fn(),
        disconnectChannel: vi.fn(),
        refreshConnection: vi.fn(),
        hasConnections: false,
      });

      const { result } = renderHook(() => useDashboard(), {
        wrapper: createWrapper(),
      });

      expect(result.current.hasConnections).toBe(false);
      expect(result.current.channelConnections).toEqual([]);
    });

    it('should handle connections loading state', () => {
      mockUseChannelConnections.mockReturnValue({
        connections: [],
        loading: true,
        connecting: false,
        connectChannel: vi.fn(),
        disconnectChannel: vi.fn(),
        refreshConnection: vi.fn(),
        hasConnections: false,
      });

      const { result } = renderHook(() => useDashboard(), {
        wrapper: createWrapper(),
      });

      expect(result.current.connectionsLoading).toBe(true);
    });
  });

  describe('Data Loading', () => {
    it('should load analytics data when user and connections are available', async () => {
      const { result } = renderHook(() => useDashboard(), {
        wrapper: createWrapper(),
      });

      // Wait for initialization and data loading
      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      await waitFor(() => {
        expect(result.current.analyticsData).toEqual(mockAnalyticsData);
      });

      expect(mockYoutubeService.getDashboardAnalytics).toHaveBeenCalledTimes(1);
    });

    it('should not load data when no user', async () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
      });

      const { result } = renderHook(() => useDashboard(), {
        wrapper: createWrapper(),
      });

      // When no user, should not load data but should still be in a stable state
      expect(result.current.analyticsData).toBeNull();
      expect(result.current.loading).toBe(false);
      expect(mockYoutubeService.getDashboardAnalytics).not.toHaveBeenCalled();
    });

    it('should not load data when no connections', async () => {
      mockUseChannelConnections.mockReturnValue({
        connections: [],
        loading: false,
        connecting: false,
        connectChannel: vi.fn(),
        disconnectChannel: vi.fn(),
        refreshConnection: vi.fn(),
        hasConnections: false,
      });

      const { result } = renderHook(() => useDashboard(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      expect(result.current.analyticsData).toBeNull();
      expect(mockYoutubeService.getDashboardAnalytics).not.toHaveBeenCalled();
    });

    it('should handle analytics loading errors', async () => {
      const error = new Error('Analytics API error');
      mockYoutubeService.getDashboardAnalytics.mockRejectedValue(error);

      const { result } = renderHook(() => useDashboard(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      expect(mockToast).toHaveBeenCalledWith({
        title: 'Error loading data',
        description: 'Failed to load dashboard data. Please try again.',
        variant: 'destructive',
      });
    });

    it('should set loading state during data fetch', async () => {
      let resolveAnalytics: (value: any) => void;
      const analyticsPromise = new Promise((resolve) => {
        resolveAnalytics = resolve;
      });
      
      mockYoutubeService.getDashboardAnalytics.mockReturnValue(analyticsPromise);

      const { result } = renderHook(() => useDashboard(), {
        wrapper: createWrapper(),
      });

      // Should be loading initially
      await waitFor(() => {
        expect(result.current.loading).toBe(true);
      });

      // Resolve the promise
      act(() => {
        resolveAnalytics(mockAnalyticsData);
      });

      // Should not be loading after resolution
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });
  });

  describe('Data Refresh', () => {
    it('should refresh data when refreshData is called', async () => {
      const { result } = renderHook(() => useDashboard(), {
        wrapper: createWrapper(),
      });

      // Wait for initial load
      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      // Clear previous calls
      vi.clearAllMocks();

      // Call refresh
      await act(async () => {
        await result.current.refreshData();
      });

      expect(mockYoutubeService.getDashboardAnalytics).toHaveBeenCalledTimes(1);
    });

    it('should handle refresh errors gracefully', async () => {
      const { result } = renderHook(() => useDashboard(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      // Mock error on refresh
      const error = new Error('Refresh failed');
      mockYoutubeService.getDashboardAnalytics.mockRejectedValue(error);

      await act(async () => {
        await result.current.refreshData();
      });

      expect(mockToast).toHaveBeenCalledWith({
        title: 'Error loading data',
        description: 'Failed to load dashboard data. Please try again.',
        variant: 'destructive',
      });
    });

    it('should force refresh even when data already exists', async () => {
      const { result } = renderHook(() => useDashboard(), {
        wrapper: createWrapper(),
      });

      // Wait for initial load
      await waitFor(() => {
        expect(result.current.analyticsData).toEqual(mockAnalyticsData);
      });

      // Clear previous calls
      vi.clearAllMocks();

      // Call refresh - should force reload
      await act(async () => {
        await result.current.refreshData();
      });

      expect(mockYoutubeService.getDashboardAnalytics).toHaveBeenCalledTimes(1);
    });
  });

  describe('Connection Management', () => {
    it('should delegate connectChannel to useChannelConnections', async () => {
      const mockConnect = vi.fn().mockResolvedValue(undefined);
      mockUseChannelConnections.mockReturnValue({
        connections: mockConnections,
        loading: false,
        connecting: false,
        connectChannel: mockConnect,
        disconnectChannel: vi.fn(),
        refreshConnection: vi.fn(),
        hasConnections: true,
      });

      const { result } = renderHook(() => useDashboard(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.connectChannel();
      });

      expect(mockConnect).toHaveBeenCalledTimes(1);
    });

    it('should delegate disconnectChannel to useChannelConnections', async () => {
      const mockDisconnect = vi.fn().mockResolvedValue(undefined);
      mockUseChannelConnections.mockReturnValue({
        connections: mockConnections,
        loading: false,
        connecting: false,
        connectChannel: vi.fn(),
        disconnectChannel: mockDisconnect,
        refreshConnection: vi.fn(),
        hasConnections: true,
      });

      const { result } = renderHook(() => useDashboard(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.disconnectChannel('connection-1');
      });

      expect(mockDisconnect).toHaveBeenCalledWith('connection-1');
    });

    it('should delegate refreshConnections to useChannelConnections', () => {
      const mockRefreshConnection = vi.fn();
      mockUseChannelConnections.mockReturnValue({
        connections: mockConnections,
        loading: false,
        connecting: false,
        connectChannel: vi.fn(),
        disconnectChannel: vi.fn(),
        refreshConnection: mockRefreshConnection,
        hasConnections: true,
      });

      const { result } = renderHook(() => useDashboard(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.refreshConnections();
      });

      expect(mockRefreshConnection).toHaveBeenCalledTimes(1);
    });
  });

  describe('State Synchronization', () => {
    it('should update when connections change', () => {
      const { result, rerender } = renderHook(() => useDashboard(), {
        wrapper: createWrapper(),
      });

      const newConnections = [
        ...mockConnections,
        {
          id: 'connection-2',
          channel_id: 'channel-2',
          channel_title: 'Another Channel',
          subscriber_count: 2000,
          video_count: 75,
        },
      ];

      mockUseChannelConnections.mockReturnValue({
        connections: newConnections,
        loading: false,
        connecting: false,
        connectChannel: vi.fn(),
        disconnectChannel: vi.fn(),
        refreshConnection: vi.fn(),
        hasConnections: true,
      });

      rerender();

      expect(result.current.channelConnections).toEqual(newConnections);
    });

    it('should update when user changes', async () => {
      const { rerender } = renderHook(() => useDashboard(), {
        wrapper: createWrapper(),
      });

      // Change user
      const newUser = { ...mockUser, id: 'new-user-id' };
      mockUseAuth.mockReturnValue({
        user: newUser,
        loading: false,
      });

      rerender();

      // Should trigger new data load
      await waitFor(() => {
        expect(mockYoutubeService.getDashboardAnalytics).toHaveBeenCalled();
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty analytics response', async () => {
      mockYoutubeService.getDashboardAnalytics.mockResolvedValue(null);

      const { result } = renderHook(() => useDashboard(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      expect(result.current.analyticsData).toBeNull();
    });

    it('should handle malformed analytics response', async () => {
      mockYoutubeService.getDashboardAnalytics.mockResolvedValue({ invalid: 'data' });

      const { result } = renderHook(() => useDashboard(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      // Should still accept the response even if malformed
      expect(result.current.analyticsData).toEqual({ invalid: 'data' });
    });

    it('should handle concurrent refresh calls', async () => {
      const { result } = renderHook(() => useDashboard(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      // Clear previous calls
      vi.clearAllMocks();

      // Make multiple concurrent refresh calls
      await act(async () => {
        await Promise.all([
          result.current.refreshData(),
          result.current.refreshData(),
          result.current.refreshData(),
        ]);
      });

      // Should only make the calls, not necessarily deduplicate (depends on implementation)
      expect(mockYoutubeService.getDashboardAnalytics).toHaveBeenCalled();
    });
  });
});
