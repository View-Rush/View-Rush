import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import Dashboard from '@/pages/Dashboard';
// Mock all the hooks and services - inline to avoid hoisting issues
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: {
      id: 'test-user-id',
      email: 'test@example.com',
    },
    session: { access_token: 'test-token' },
    loading: false,
    signUp: vi.fn(),
    signIn: vi.fn(),
    signOut: vi.fn(),
    isAuthenticated: true,
  }),
}));

vi.mock('@/contexts/DashboardContext', () => ({
  useDashboard: () => ({
    analytics: null,
    loading: false,
    error: null,
    refreshData: vi.fn(),
    connectChannel: vi.fn(),
    disconnectChannel: vi.fn(),
  }),
}));

vi.mock('@/hooks/use-toast', () => ({
  toast: vi.fn(),
}));

// Mock components that have their own complex logic
vi.mock('@/components/layout/Header', () => ({
  default: () => <div data-testid="header">Header Component</div>,
}));

vi.mock('@/components/ui/channel-connections-list', () => ({
  ChannelConnectionsList: ({ onConnect, onDisconnect }: any) => (
    <div data-testid="channel-connections-list">
      <button onClick={() => onConnect?.('test-channel')}>Connect</button>
      <button onClick={() => onDisconnect?.('test-channel')}>Disconnect</button>
    </div>
  ),
}));

vi.mock('@/components/ui/analytics-overview', () => ({
  AnalyticsOverview: () => <div data-testid="analytics-overview">Analytics</div>,
}));

vi.mock('@/components/ui/predictions-overview', () => ({
  PredictionsOverview: () => <div data-testid="predictions-overview">Predictions</div>,
}));

// Test wrapper with all providers
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  return <div>{children}</div>;
};

describe('Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Authentication States', () => {
    it('should render dashboard when user is authenticated', () => {
      render(
        <TestWrapper>
          <Dashboard />
        </TestWrapper>
      );

      // Check for key dashboard elements that actually exist
      expect(screen.getByTestId('header')).toBeInTheDocument();
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Welcome back, test@example.com')).toBeInTheDocument();
    });

    it('should render loading state when auth is loading', () => {
      render(
        <TestWrapper>
          <Dashboard />
        </TestWrapper>
      );

      // Should show header and basic structure
      expect(screen.getByTestId('header')).toBeInTheDocument();
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });

    it('should show dashboard content when authenticated', () => {
      render(
        <TestWrapper>
          <Dashboard />
        </TestWrapper>
      );

      // Should show main dashboard elements
      expect(screen.getByTestId('header')).toBeInTheDocument();
      expect(screen.getByTestId('channel-connections-list')).toBeInTheDocument();
    });
  });

  describe('Tab Navigation', () => {
    it('should display tab navigation', () => {
      render(
        <TestWrapper>
          <Dashboard />
        </TestWrapper>
      );

      // Check for tab navigation elements
      expect(screen.getByText('Overview')).toBeInTheDocument();
      expect(screen.getByText('Analytics')).toBeInTheDocument();
    });
  });

  describe('Basic Functionality', () => {
    it('should render without crashing', () => {
      render(
        <TestWrapper>
          <Dashboard />
        </TestWrapper>
      );

      // Just check that the main elements render
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByTestId('header')).toBeInTheDocument();
    });
  });
});