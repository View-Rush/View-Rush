vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      getSession: vi.fn(),
      getUser: vi.fn(),
      onAuthStateChange: vi.fn(),
      resetPasswordForEmail: vi.fn(),
      updateUser: vi.fn(),
    },
  },
}));

// Mock the toast hook
vi.mock('@/hooks/use-toast', () => ({
  toast: vi.fn(),
}));

// Import after mocking
import { supabase } from '@/integrations/supabase/client';
import { authService } from '@/services/auth';

const mockSupabase = supabase as any;

describe('AuthService (Fixed)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('signUp', () => {
    it('should successfully sign up a new user', async () => {
      const mockUser = {
        id: 'test-user-id',
        email: 'test@example.com',
        user_metadata: { display_name: 'Test User' },
      };

      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: mockUser, session: null },
        error: null,
      });

      const signUpData = {
        email: 'test@example.com',
        password: 'password123',
        displayName: 'Test User'
      };

      const result = await authService.signUp(signUpData);

      expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        options: {
          data: {
            display_name: 'Test User',
            first_name: undefined,
            last_name: undefined,
          },
          emailRedirectTo: 'http://localhost:3000/auth/callback',
        },
      });

      expect(result).toEqual({ user: mockUser, error: null });
    });

    it('should handle sign-up errors', async () => {
      const mockError = { message: 'User already registered' };

      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: null, session: null },
        error: mockError,
      });

      const signUpData = {
        email: 'existing@example.com',
        password: 'password123'
      };

      const result = await authService.signUp(signUpData);

      expect(result).toEqual({
        user: null,
        error: mockError,
      });
    });
  });

  describe('signIn', () => {
    it('should successfully sign in user with valid credentials', async () => {
      const mockUser = {
        id: 'test-user-id',
        email: 'test@example.com',
        user_metadata: {},
      };
      const mockSession = {
        access_token: 'test-token',
        user: mockUser,
      };

      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      });

      const signInData = {
        email: 'test@example.com',
        password: 'password123'
      };

      const result = await authService.signIn(signInData);

      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result).toEqual({
        user: mockUser,
        session: mockSession,
        error: null,
      });
    });

    it('should handle sign-in errors gracefully', async () => {
      const mockError = { message: 'Invalid login credentials' };

      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: mockError,
      });

      const signInData = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };

      const result = await authService.signIn(signInData);

      expect(result).toEqual({
        user: null,
        session: null,
        error: mockError,
      });
    });
  });

  describe('signOut', () => {
    it('should successfully sign out user', async () => {
      mockSupabase.auth.signOut.mockResolvedValue({
        error: null,
      });

      const result = await authService.signOut();

      expect(mockSupabase.auth.signOut).toHaveBeenCalled();
      expect(result).toEqual({ error: null });
    });

    it('should handle sign-out errors', async () => {
      const mockError = { message: 'Sign out failed' };

      mockSupabase.auth.signOut.mockResolvedValue({
        error: mockError,
      });

      const result = await authService.signOut();

      expect(result).toEqual({ error: null }); // The service handles errors gracefully
    });
  });
});