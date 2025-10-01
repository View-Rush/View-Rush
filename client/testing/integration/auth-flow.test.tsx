import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing/utils/test-helpers';
import * as useAuthModule from '@/hooks/useAuth';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

// Mock the useAuth hook for integration testing
const mockUseAuth = vi.spyOn(useAuthModule, 'useAuth');

describe('Authentication Flow Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should handle complete authentication flow from loading to authenticated', async () => {
    // Start with loading state
    mockUseAuth.mockReturnValue({
      user: null,
      session: null,
      loading: true,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      resetPassword: vi.fn(),
      updatePassword: vi.fn(),
      updateProfile: vi.fn(),
    });

    const { rerender } = render(
      <ProtectedRoute>
        <div data-testid="dashboard-content">
          <h1>Dashboard</h1>
          <p>Welcome to your dashboard!</p>
        </div>
      </ProtectedRoute>,
      { initialEntries: ['/dashboard'] }
    );

    // Should show loading state
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
    expect(screen.queryByTestId('dashboard-content')).not.toBeInTheDocument();

    // Transition to authenticated state
    const mockUser = {
      id: 'test-user-id',
      email: 'test@example.com',
      user_metadata: { display_name: 'Test User' },
      app_metadata: {},
      aud: 'authenticated',
      created_at: '2023-01-01T00:00:00.000Z',
      updated_at: '2023-01-01T00:00:00.000Z',
    };

    mockUseAuth.mockReturnValue({
      user: mockUser,
      session: {
        access_token: 'test-token',
        user: mockUser,
        expires_in: 3600,
        expires_at: Date.now() + 3600000,
        refresh_token: 'refresh-token',
        token_type: 'bearer',
      },
      loading: false,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      resetPassword: vi.fn(),
      updatePassword: vi.fn(),
      updateProfile: vi.fn(),
    });

    rerender(
      <ProtectedRoute>
        <div data-testid="dashboard-content">
          <h1>Dashboard</h1>
          <p>Welcome to your dashboard!</p>
        </div>
      </ProtectedRoute>
    );

    // Should show authenticated content
    await waitFor(() => {
      expect(screen.getByTestId('dashboard-content')).toBeInTheDocument();
    });

    expect(screen.getByRole('heading', { name: /dashboard/i })).toBeInTheDocument();
    expect(screen.getByText(/welcome to your dashboard/i)).toBeInTheDocument();
    expect(document.querySelector('.animate-spin')).not.toBeInTheDocument();
  });

  it('should redirect unauthenticated users appropriately', async () => {
    // Start with unauthenticated state
    mockUseAuth.mockReturnValue({
      user: null,
      session: null,
      loading: false,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      resetPassword: vi.fn(),
      updatePassword: vi.fn(),
      updateProfile: vi.fn(),
    });

    render(
      <ProtectedRoute>
        <div data-testid="dashboard-content">Dashboard Content</div>
      </ProtectedRoute>,
      { initialEntries: ['/dashboard'] }
    );

    // Should not show protected content
    expect(screen.queryByTestId('dashboard-content')).not.toBeInTheDocument();
  });

  it('should handle authentication state changes', async () => {
    const mockUser = {
      id: 'test-user-id',
      email: 'test@example.com',
      user_metadata: { display_name: 'Test User' },
      app_metadata: {},
      aud: 'authenticated',
      created_at: '2023-01-01T00:00:00.000Z',
      updated_at: '2023-01-01T00:00:00.000Z',
    };

    // Start authenticated
    mockUseAuth.mockReturnValue({
      user: mockUser,
      session: {
        access_token: 'test-token',
        user: mockUser,
        expires_in: 3600,
        expires_at: Date.now() + 3600000,
        refresh_token: 'refresh-token',
        token_type: 'bearer',
      },
      loading: false,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      resetPassword: vi.fn(),
      updatePassword: vi.fn(),
      updateProfile: vi.fn(),
    });

    const { rerender } = render(
      <ProtectedRoute>
        <div data-testid="dashboard-content">
          <h1>Dashboard</h1>
          <button onClick={() => {}}>Test Button</button>
        </div>
      </ProtectedRoute>
    );

    // Should show authenticated content
    expect(screen.getByTestId('dashboard-content')).toBeInTheDocument();

    // Simulate state change to unauthenticated
    mockUseAuth.mockReturnValue({
      user: null,
      session: null,
      loading: false,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      resetPassword: vi.fn(),
      updatePassword: vi.fn(),
      updateProfile: vi.fn(),
    });

    rerender(
      <ProtectedRoute>
        <div data-testid="dashboard-content">
          <h1>Dashboard</h1>
          <button onClick={() => {}}>Test Button</button>
        </div>
      </ProtectedRoute>
    );

    // Should no longer show protected content
    await waitFor(() => {
      expect(screen.queryByTestId('dashboard-content')).not.toBeInTheDocument();
    });
  });

  it('should handle loading states correctly', async () => {
    // Test loading -> unauthenticated transition
    mockUseAuth.mockReturnValue({
      user: null,
      session: null,
      loading: true,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      resetPassword: vi.fn(),
      updatePassword: vi.fn(),
      updateProfile: vi.fn(),
    });

    const { rerender } = render(
      <ProtectedRoute>
        <div data-testid="dashboard-content">Dashboard Content</div>
      </ProtectedRoute>
    );

    // Should show loading
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();

    // Transition to unauthenticated
    mockUseAuth.mockReturnValue({
      user: null,
      session: null,
      loading: false,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      resetPassword: vi.fn(),
      updatePassword: vi.fn(),
      updateProfile: vi.fn(),
    });

    rerender(
      <ProtectedRoute>
        <div data-testid="dashboard-content">Dashboard Content</div>
      </ProtectedRoute>
    );

    // Should no longer show loading
    await waitFor(() => {
      expect(document.querySelector('.animate-spin')).not.toBeInTheDocument();
    });

    // Should not show protected content
    expect(screen.queryByTestId('dashboard-content')).not.toBeInTheDocument();
  });
});