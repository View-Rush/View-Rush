import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { createMockSupabaseClient } from '@testing/utils/test-helpers';

// Mock the auth services that useAuth depends on 
vi.mock('@/services/auth', () => ({
  authService: {
    signIn: vi.fn().mockResolvedValue({ user: null, session: null, error: null }),
    signUp: vi.fn().mockResolvedValue({ user: null, error: null }), 
    signOut: vi.fn().mockResolvedValue({ error: null }),
    resetPassword: vi.fn().mockResolvedValue({ error: null }),
    updatePassword: vi.fn().mockResolvedValue({ user: null, error: null }),
    updateProfile: vi.fn().mockResolvedValue({ user: null, error: null }),
    getSession: vi.fn().mockResolvedValue({ session: null, error: null }),
    onAuthStateChange: vi.fn(() => ({
      data: { subscription: { unsubscribe: vi.fn() } }
    })),
  },
}));

vi.mock('@/services/authHelper', () => ({
  authHelper: {
    clearCache: vi.fn(),
    setUserFromContext: vi.fn(),
  },
}));

// Mock React Router
vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
}));

// Mock the Supabase client
const mockSupabase = createMockSupabaseClient();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabase,
}));

vi.mock('@/hooks/use-toast', () => ({
  toast: vi.fn(),
}));

// Unmock the useAuth hook for this test since we want to test the real implementation
vi.unmock('@/hooks/useAuth');
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import { authService } from '@/services/auth';

// Cast to mocked version
const mockAuthService = vi.mocked(authService);

describe('useAuth Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Restore default mock behaviors after each test
    mockAuthService.getSession.mockResolvedValue({ session: null, error: null });
    mockAuthService.signIn.mockResolvedValue({ user: null, session: null, error: null });
    mockAuthService.signUp.mockResolvedValue({ user: null, error: null });
    mockAuthService.signOut.mockResolvedValue({ error: null });
    mockAuthService.resetPassword.mockResolvedValue({ error: null });
    mockAuthService.updatePassword.mockResolvedValue({ error: null });
    mockAuthService.updateProfile.mockResolvedValue({ user: null, error: null });
  });

  afterEach(() => {
    // Don't reset mocks, just clear call history
    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <AuthProvider>{children}</AuthProvider>
  );

  describe('initialization', () => {
    it('should start with loading state', () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.loading).toBe(true);
      expect(result.current.user).toBe(null);
      expect(result.current.session).toBe(null);
    });

    it('should initialize auth state on mount', async () => {
      const mockUser = {
        id: 'test-user-id',
        email: 'test@example.com',
        user_metadata: { display_name: 'Test User' },
        app_metadata: {},
        aud: 'authenticated',
        created_at: '2023-01-01T00:00:00.000Z',
        updated_at: '2023-01-01T00:00:00.000Z',
      };

      const mockSession = {
        access_token: 'test-token',
        user: mockUser,
        expires_in: 3600,
        expires_at: Date.now() + 3600000,
        refresh_token: 'refresh-token',
        token_type: 'bearer',
      };

      mockAuthService.getSession.mockResolvedValue({
        session: mockSession,
        error: null,
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.session).toEqual(mockSession);
    });
  });

  describe('signIn', () => {
    it('should handle successful sign in', async () => {
      const mockUser = {
        id: 'test-user-id',
        email: 'test@example.com',
        user_metadata: {},
        app_metadata: {},
        aud: 'authenticated',
        created_at: '2023-01-01T00:00:00.000Z',
        updated_at: '2023-01-01T00:00:00.000Z',
      };

      const mockSession = {
        access_token: 'test-token',
        user: mockUser,
        expires_in: 3600,
        expires_at: Date.now() + 3600000,
        refresh_token: 'refresh-token',
        token_type: 'bearer',
      };

      mockAuthService.signIn.mockResolvedValue({
        user: mockUser, 
        session: mockSession,
        error: null,
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        const response = await result.current.signIn('test@example.com', 'password');
        expect(response).toEqual({
          data: { user: mockUser, session: mockSession },
          error: null,
        });
      });

      expect(mockAuthService.signIn).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password',
      });
    });

    it('should handle sign in errors', async () => {
      const mockError = { message: 'Invalid credentials' };

      mockAuthService.signIn.mockResolvedValue({
        user: null,
        session: null,
        error: mockError,
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        const response = await result.current.signIn('test@example.com', 'wrong-password');
        expect(response).toEqual({
          data: { user: null, session: null },
          error: mockError,
        });
      });
    });
  });

  describe('signUp', () => {
    it('should handle successful sign up', async () => {
      const mockUser = {
        id: 'new-user-id',
        email: 'newuser@example.com',
        user_metadata: { display_name: 'New User' },
        app_metadata: {},
        aud: 'authenticated',
        created_at: '2023-01-01T00:00:00.000Z',
        updated_at: '2023-01-01T00:00:00.000Z',
      };

      mockAuthService.signUp.mockResolvedValue({
        user: mockUser,
        error: null,
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        const response = await result.current.signUp('newuser@example.com', 'password');
        expect(response).toEqual({
          data: { user: mockUser },
          error: null,
        });
      });

      expect(mockAuthService.signUp).toHaveBeenCalledWith({
        email: 'newuser@example.com',
        password: 'password',
      });
    });
  });

  describe('signOut', () => {
    it('should handle successful sign out', async () => {
      mockAuthService.signOut.mockResolvedValue({
        error: null,
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        const response = await result.current.signOut();
        expect(response).toEqual({ error: null });
      });

      expect(mockAuthService.signOut).toHaveBeenCalled();
    });
  });

  describe('resetPassword', () => {
    it('should handle password reset request', async () => {
      mockAuthService.resetPassword.mockResolvedValue({
        error: null,
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        const response = await result.current.resetPassword('test@example.com');
        expect(response).toEqual({ data: {}, error: null });
      });

      expect(mockAuthService.resetPassword).toHaveBeenCalledWith({ email: 'test@example.com' });
    });
  });

  describe('updatePassword', () => {
    it('should handle password update', async () => {
      const mockUser = {
        id: 'test-user-id',
        email: 'test@example.com',
        user_metadata: {},
        app_metadata: {},
        aud: 'authenticated',
        created_at: '2023-01-01T00:00:00.000Z',
        updated_at: '2023-01-01T00:00:00.000Z',
      };

      mockAuthService.updatePassword.mockResolvedValue({
        user: mockUser,
        error: null,
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        const response = await result.current.updatePassword('newpassword');
        expect(response).toEqual({ data: {}, error: null });
      });

      expect(mockAuthService.updatePassword).toHaveBeenCalledWith({
        password: '',
        newPassword: 'newpassword',
      });
    });
  });

  describe('updateProfile', () => {
    it('should handle profile update', async () => {
      const mockUser = {
        id: 'test-user-id',
        email: 'test@example.com',
        user_metadata: { display_name: 'Updated Name' },
        app_metadata: {},
        aud: 'authenticated',
        created_at: '2023-01-01T00:00:00.000Z',
        updated_at: '2023-01-01T00:00:00.000Z',
      };

      mockAuthService.updateProfile.mockResolvedValue({
        user: mockUser,
        error: null,
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      const updates = { display_name: 'Updated Name' };

      await act(async () => {
        const response = await result.current.updateProfile(updates);
        expect(response).toEqual({ data: { user: mockUser }, error: null });
      });

      expect(mockAuthService.updateProfile).toHaveBeenCalledWith(updates);
    });
  });

  describe('auth state changes', () => {
    it('should handle sign in return value correctly', async () => {
      const mockUser = {
        id: 'test-user-id',
        email: 'test@example.com',
        user_metadata: {},
        app_metadata: {},
        aud: 'authenticated',
        created_at: '2023-01-01T00:00:00.000Z',
        updated_at: '2023-01-01T00:00:00.000Z',
      };

      const mockSession = {
        access_token: 'test-token',
        user: mockUser,
        expires_in: 3600,
        expires_at: Date.now() + 3600000,
        refresh_token: 'refresh-token',
        token_type: 'bearer',
      };

      // Mock successful sign in
      mockAuthService.signIn.mockResolvedValue({
        user: mockUser,
        session: mockSession,
        error: null,
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      // Wait for initial mount to complete
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Test that sign in returns the correct data
      await act(async () => {
        const response = await result.current.signIn('test@example.com', 'password');
        expect(response).toEqual({
          data: { user: mockUser, session: mockSession },
          error: null,
        });
      });

      // Verify the auth service was called correctly
      expect(mockAuthService.signIn).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password',
      });
    });
  });

  describe('error handling', () => {
    it('should handle initialization errors gracefully', async () => {
      mockAuthService.getSession.mockResolvedValue({
        session: null,
        error: { message: 'Session error' },
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.user).toBeNull();
      expect(result.current.session).toBeNull();
    });
  });
});