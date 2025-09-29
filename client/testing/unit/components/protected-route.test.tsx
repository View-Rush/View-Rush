import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing/utils/test-helpers';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import * as useAuthModule from '@/hooks/useAuth';

// Mock the useAuth hook
const mockUseAuth = vi.spyOn(useAuthModule, 'useAuth');

describe('ProtectedRoute Component', () => {
  it('should show loading spinner when loading is true', () => {
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

    render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>,
      { initialEntries: ['/dashboard'] }
    );

    // Should show loading spinner and not show protected content
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('should redirect to auth when user is not authenticated', () => {
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
        <div>Protected Content</div>
      </ProtectedRoute>,
      { initialEntries: ['/dashboard'] }
    );

    // Should not render protected content
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('should render children when user is authenticated', () => {
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

    render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>,
      { initialEntries: ['/dashboard'] }
    );

    // Should render protected content
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('should handle complex children components', () => {
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

    render(
      <ProtectedRoute>
        <div>
          <h1>Dashboard</h1>
          <p>Welcome, {mockUser.user_metadata?.display_name}!</p>
          <button>Action Button</button>
        </div>
      </ProtectedRoute>,
      { initialEntries: ['/dashboard'] }
    );

    expect(screen.getByRole('heading', { name: /dashboard/i })).toBeInTheDocument();
    expect(screen.getByText(/welcome, test user!/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /action button/i })).toBeInTheDocument();
  });

  it('should show proper loading state styling', () => {
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

    render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    // Check for loading spinner styling
    const loadingSpinner = document.querySelector('.animate-spin');
    expect(loadingSpinner).toBeInTheDocument();
    expect(loadingSpinner).toHaveClass('rounded-full', 'h-32', 'w-32', 'border-b-2', 'border-primary');
  });

  it('should handle state transitions correctly', () => {
    const mockUser = {
      id: 'test-user-id',
      email: 'test@example.com',
      user_metadata: { display_name: 'Test User' },
      app_metadata: {},
      aud: 'authenticated',
      created_at: '2023-01-01T00:00:00.000Z',
      updated_at: '2023-01-01T00:00:00.000Z',
    };

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
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    // Should show loading
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();

    // Transition to authenticated state
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
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    // Should show content
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
    expect(document.querySelector('.animate-spin')).not.toBeInTheDocument();
  });
});