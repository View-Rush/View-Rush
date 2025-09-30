import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useChannelConnections } from '@/hooks/useChannelConnections';
import { createMockSupabaseClient } from '@testing/utils/test-helpers';
import * as useAuthModule from '@/hooks/useAuth';
import { youtubeService } from '@/services/youtube';

// Unmock the hook to avoid global mock interference
vi.unmock('@/hooks/useChannelConnections');

// Mock the Supabase client
const mockSupabase = createMockSupabaseClient();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabase,
}));

vi.mock('@/hooks/use-toast', () => ({
  toast: vi.fn(),
}));

vi.mock('@/services/youtube', () => ({
  youtubeService: {
    getUserConnections: vi.fn(),
    connectAccount: vi.fn(),
    disconnectAccount: vi.fn(),
    syncChannelAnalytics: vi.fn(),
  },
}));

vi.mock('@/services/connectionStateManager', () => ({
  connectionStateManager: {
    isConnecting: vi.fn().mockReturnValue(false),
  },
}));

const mockUseAuth = vi.spyOn(useAuthModule, 'useAuth');
const mockYoutubeService = vi.mocked(youtubeService);

describe('useChannelConnections Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Set up default useAuth mock
    mockUseAuth.mockReturnValue({
      user: {
        id: 'user-1',
        email: 'test@example.com',
        user_metadata: {},
        app_metadata: {},
        aud: 'authenticated',
        created_at: '2023-01-01T00:00:00.000Z',
        updated_at: '2023-01-01T00:00:00.000Z',
      },
      loading: false,
      session: null,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      resetPassword: vi.fn(),
      updatePassword: vi.fn(),
      updateProfile: vi.fn(),
    });

    // Set up default youtube service mocks
    mockYoutubeService.getUserConnections.mockResolvedValue([]);
    mockYoutubeService.connectAccount.mockResolvedValue(true);
    mockYoutubeService.disconnectAccount.mockResolvedValue(undefined);
    mockYoutubeService.syncChannelAnalytics.mockResolvedValue(undefined);
  });

  const mockConnections = [
    {
      id: 'conn-1',
      user_id: 'user-1',
      channel_id: 'UC123456',
      channel_name: 'Test Channel 1',
      channel_handle: '@testchannel1',
      channel_avatar_url: 'https://example.com/avatar1.jpg',
      is_active: true,
      created_at: '2023-01-01T00:00:00.000Z',
      updated_at: '2023-01-01T00:00:00.000Z',
      error_message: null,
      last_sync_at: null,
      sync_status: 'idle',
      platform: 'youtube',
      metadata: null,
      scope_granted: ['youtube.readonly'],
      token_expires_at: null,
      tokens_encrypted: true,
    },
    {
      id: 'conn-2',
      user_id: 'user-1',
      channel_id: 'UC789012',
      channel_name: 'Test Channel 2',
      channel_handle: '@testchannel2',
      channel_avatar_url: 'https://example.com/avatar2.jpg',
      is_active: false,
      created_at: '2023-01-02T00:00:00.000Z',
      updated_at: '2023-01-02T00:00:00.000Z',
      error_message: null,
      last_sync_at: null,
      sync_status: 'idle',
      platform: 'youtube',
      metadata: null,
      scope_granted: ['youtube.readonly'],
      token_expires_at: null,
      tokens_encrypted: true,
    },
  ];

  it('should initialize with loading state', () => {
    // getUserConnections is already mocked to return [] in beforeEach
    const { result } = renderHook(() => useChannelConnections());

    expect(result.current.connections).toEqual([]);
    expect(result.current.loading).toBe(true);
    expect(result.current.hasConnections).toBe(false);
    expect(result.current.hasActiveConnections).toBe(false);
    expect(result.current.activeConnectionsCount).toBe(0);
  });

  it('should handle unauthenticated state', async () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: false,
      session: null,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      resetPassword: vi.fn(),
      updatePassword: vi.fn(),
      updateProfile: vi.fn(),
    });

    const { result } = renderHook(() => useChannelConnections());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.connections).toEqual([]);
    expect(result.current.hasConnections).toBe(false);
  });

  it('should handle auth loading state', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: true,
      session: null,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      resetPassword: vi.fn(),
      updatePassword: vi.fn(),
      updateProfile: vi.fn(),
    });

    const { result } = renderHook(() => useChannelConnections());

    // Should not load connections when auth is loading, so loading should be false
    expect(result.current.loading).toBe(false);
    expect(result.current.connections).toEqual([]);
  });

  it('should compute connection statistics correctly', async () => {
    // Mock getUserConnections to return mock data
    mockYoutubeService.getUserConnections.mockResolvedValue(mockConnections);

    const { result } = renderHook(() => useChannelConnections());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.connections).toEqual(mockConnections);
    expect(result.current.hasConnections).toBe(true);
    expect(result.current.hasActiveConnections).toBe(true);
    expect(result.current.activeConnectionsCount).toBe(1);
  });

  it('should handle loadConnections method', async () => {
    // Reset the mock to return empty array first for initial load
    mockYoutubeService.getUserConnections.mockResolvedValueOnce([]);
    // Then return mock data for the manual refresh call
    mockYoutubeService.getUserConnections.mockResolvedValueOnce(mockConnections);

    const { result } = renderHook(() => useChannelConnections());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Call loadConnections manually
    await waitFor(async () => {
      await result.current.loadConnections(true); // Force refresh
    });

    expect(result.current.connections).toEqual(mockConnections);
  });

  it('should handle connectChannel method', async () => {
    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
      }),
    });

    const { result } = renderHook(() => useChannelConnections());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(typeof result.current.connectChannel).toBe('function');
  });

  it('should handle disconnectChannel method', async () => {
    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: mockConnections,
            error: null,
          }),
        }),
      }),
    });

    const { result } = renderHook(() => useChannelConnections());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(typeof result.current.disconnectChannel).toBe('function');
  });

  it('should handle refreshConnection method', async () => {
    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: mockConnections,
            error: null,
          }),
        }),
      }),
    });

    const { result } = renderHook(() => useChannelConnections());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(typeof result.current.refreshConnection).toBe('function');
  });

  it('should handle connecting state', () => {
    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
      }),
    });

    const { result } = renderHook(() => useChannelConnections());

    expect(result.current.connecting).toBe(false);
    expect(typeof result.current.connecting).toBe('boolean');
  });
});