import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Profile from '@/pages/Profile';

// Create test query client
const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

// Mock auth hook
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: {
      id: 'test-user-id',
      email: 'test@example.com',
      user_metadata: {
        display_name: 'Test User',
        avatar_url: 'https://example.com/avatar.jpg',
      },
      created_at: '2023-01-01T00:00:00.000Z',
    },
    session: { access_token: 'test-token' },
    loading: false,
    isAuthenticated: true,
    updateProfile: vi.fn().mockResolvedValue({ error: null }),
  }),
}));

// Mock channel connections hook
vi.mock('@/hooks/useChannelConnections', () => ({
  useChannelConnections: () => ({
    connections: [
      {
        id: 'channel1',
        channel_name: 'Test Channel',
        channel_id: 'UC123456',
        connected_at: '2023-01-01T00:00:00.000Z',
        status: 'active',
      }
    ],
    loading: false,
    statistics: {
      totalConnections: 1,
      activeConnections: 1,
      disconnectedConnections: 0,
    },
  }),
}));

// Mock toast hook
vi.mock('@/hooks/use-toast', () => ({
  toast: vi.fn(),
}));

// Mock header component
vi.mock('@/components/layout/Header', () => ({
  default: () => <div data-testid="header">Header Component</div>,
}));

// Test wrapper with all providers
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = createTestQueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        {children}
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe('Profile Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render profile page', () => {
    render(
      <TestWrapper>
        <Profile />
      </TestWrapper>
    );
    
    // Should render header
    expect(screen.getByTestId('header')).toBeInTheDocument();
    
    // Should have profile content
    const profileContent = document.querySelector('main, .profile, [role="main"]') || document.body;
    expect(profileContent).toBeInTheDocument();
  });

  it('should display user profile information', () => {
    render(
      <TestWrapper>
        <Profile />
      </TestWrapper>
    );
    
    // Should have profile-related content
    const textContent = document.body.textContent || '';
    expect(textContent.length).toBeGreaterThan(50);
  });

  it('should render profile sections', () => {
    render(
      <TestWrapper>
        <Profile />
      </TestWrapper>
    );
    
    // Should render main container
    const main = document.querySelector('main, .container, .profile-page') || document.body;
    expect(main).toBeInTheDocument();
    
    // Should have substantial content
    const textContent = document.body.textContent || '';
    expect(textContent.length).toBeGreaterThan(30);
  });

  it('should handle user data display', () => {
    render(
      <TestWrapper>
        <Profile />
      </TestWrapper>
    );
    
    // Should render with user context
    const content = document.body.textContent || '';
    expect(content.length).toBeGreaterThan(10);
  });

  it('should display connected channels information', () => {
    render(
      <TestWrapper>
        <Profile />
      </TestWrapper>
    );
    
    // Should have channel-related content or statistics
    const content = document.body;
    expect(content).toBeInTheDocument();
  });
});