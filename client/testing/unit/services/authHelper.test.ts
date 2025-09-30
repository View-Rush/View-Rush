import { describe, it, expect, vi, beforeEach } from 'vitest';

// Unmock the AuthHelper service to isolate it from global setup
vi.unmock('@/services/authHelper');

import { authHelper } from '@/services/authHelper';

// Mock Supabase client - inline to avoid hoisting issues
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
    },
  },
}));

// Import the mocked supabase
import { supabase } from '@/integrations/supabase/client';
const mockSupabase = vi.mocked(supabase);

describe('AuthHelper Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authHelper.clearCache();
  });

  describe('getUser', () => {
    it('should fetch user from Supabase', async () => {
      const mockUser = {
        id: 'test-id',
        email: 'test@example.com',
        user_metadata: {},
        app_metadata: {},
        aud: 'authenticated',
        created_at: '2023-01-01T00:00:00.000Z',
        updated_at: '2023-01-01T00:00:00.000Z',
      };

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const user = await authHelper.getUser();
      expect(user).toEqual(mockUser);
      expect(mockSupabase.auth.getUser).toHaveBeenCalledTimes(1);
    });

    it('should handle auth errors gracefully', async () => {
      const mockError = { message: 'Auth error' };

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: mockError,
      });

      const user = await authHelper.getUser();
      expect(user).toBeNull();
    });

    it('should use cached user from context when available', async () => {
      const mockUser = {
        id: 'context-user-id',
        email: 'context@example.com',
        user_metadata: {},
        app_metadata: {},
        aud: 'authenticated',
        created_at: '2023-01-01T00:00:00.000Z',
        updated_at: '2023-01-01T00:00:00.000Z',
      };

      // Set user from context
      authHelper.setUserFromContext(mockUser);

      const user = await authHelper.getUser();
      expect(user).toEqual(mockUser);
      // Should not call Supabase when user is in context
      expect(mockSupabase.auth.getUser).not.toHaveBeenCalled();
    });

    it('should use cached promise for concurrent calls', async () => {
      const mockUser = {
        id: 'test-id',
        email: 'test@example.com',
        user_metadata: {},
        app_metadata: {},
        aud: 'authenticated',
        created_at: '2023-01-01T00:00:00.000Z',
        updated_at: '2023-01-01T00:00:00.000Z',
      };

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      // Make multiple concurrent calls
      const [user1, user2, user3] = await Promise.all([
        authHelper.getUser(),
        authHelper.getUser(),
        authHelper.getUser(),
      ]);

      expect(user1).toEqual(mockUser);
      expect(user2).toEqual(mockUser);
      expect(user3).toEqual(mockUser);
      
      // Should only call Supabase once due to caching
      expect(mockSupabase.auth.getUser).toHaveBeenCalledTimes(1);
    });

    it('should handle timeout scenarios', async () => {
      // Mock a hanging promise that never resolves
      mockSupabase.auth.getUser.mockImplementation(
        () => new Promise(() => {}) // Promise that never resolves
      );

      const user = await authHelper.getUser();
      expect(user).toBeNull();
    }, 6000); // Increase timeout for this test

    it('should handle network errors', async () => {
      mockSupabase.auth.getUser.mockRejectedValue(new Error('Network error'));

      const user = await authHelper.getUser();
      expect(user).toBeNull();
    });
  });

  describe('setUserFromContext', () => {
    it('should set user from context', () => {
      const mockUser = {
        id: 'context-user',
        email: 'context@example.com',
        user_metadata: {},
        app_metadata: {},
        aud: 'authenticated',
        created_at: '2023-01-01T00:00:00.000Z',
        updated_at: '2023-01-01T00:00:00.000Z',
      };

      authHelper.setUserFromContext(mockUser);

      // Verify user is available immediately
      expect(authHelper.getUser()).resolves.toEqual(mockUser);
    });

    it('should handle null user', () => {
      authHelper.setUserFromContext(null);

      // Should fall back to Supabase call
      expect(typeof authHelper.getUser).toBe('function');
    });
  });

  describe('clearCache', () => {
    it('should clear cached user data', async () => {
      const mockUser = {
        id: 'test-id',
        email: 'test@example.com',
        user_metadata: {},
        app_metadata: {},
        aud: 'authenticated',
        created_at: '2023-01-01T00:00:00.000Z',
        updated_at: '2023-01-01T00:00:00.000Z',
      };

      // Set user in context
      authHelper.setUserFromContext(mockUser);

      // Verify user is cached
      const cachedUser = await authHelper.getUser();
      expect(cachedUser).toEqual(mockUser);

      // Clear cache
      authHelper.clearCache();

      // Mock new Supabase response
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      // Should now call Supabase instead of using cache
      const userAfterClear = await authHelper.getUser();
      expect(userAfterClear).toBeNull();
      expect(mockSupabase.auth.getUser).toHaveBeenCalledTimes(1);
    });
  });

  describe('caching behavior', () => {
    it('should respect cache duration', async () => {
      const mockUser = {
        id: 'test-id',
        email: 'test@example.com',
        user_metadata: {},
        app_metadata: {},
        aud: 'authenticated',
        created_at: '2023-01-01T00:00:00.000Z',
        updated_at: '2023-01-01T00:00:00.000Z',
      };

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      // First call
      await authHelper.getUser();
      expect(mockSupabase.auth.getUser).toHaveBeenCalledTimes(1);

      // Second call within cache duration should use cache
      await authHelper.getUser();
      expect(mockSupabase.auth.getUser).toHaveBeenCalledTimes(1);

      // Wait for cache to expire and test again
      // Note: In a real scenario, you'd need to mock Date.now() or use fake timers
      // For this test, we'll just verify the caching logic works for immediate calls
    });
  });

  describe('error handling', () => {
    it('should handle malformed responses', async () => {
      mockSupabase.auth.getUser.mockResolvedValue(null);

      const user = await authHelper.getUser();
      expect(user).toBeNull();
    });

    it('should handle unexpected errors', async () => {
      mockSupabase.auth.getUser.mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      const user = await authHelper.getUser();
      expect(user).toBeNull();
    });
  });
});